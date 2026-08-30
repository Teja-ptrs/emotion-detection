import base64
import json
import uuid
import datetime
import cv2
import numpy as np
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.core.config import settings
from backend.core.database import get_db
from backend.db.models import SessionModel, FaceModel, EmotionRecordModel
from backend.schemas.schemas import (
    SystemHealthResponse,
    ModelStatusResponse,
    SessionCreateRequest,
    SessionResponse,
    SessionStopRequest,
    PredictionRequest,
    PredictionResponse,
    FaceDetectionResult,
    BoundingBox,
    HistoryFilter,
    HistoryListResponse,
    AnalyticsOverviewResponse,
    EmotionTrendsResponse,
    AIInsightResponse
)
from backend.services.face_detector import FaceDetector
from backend.services.face_tracker import FaceTracker
from backend.services.landmark_detector import LandmarkDetector
from backend.services.feature_extractor import GeometricFeatureExtractor
from backend.services.emotion_classifier import EmotionClassifier
from backend.services.analytics_engine import AnalyticsEngine
from backend.services.insights_engine import InsightsEngine

router = APIRouter()

# Global AI Singletons (Loaded Once for high-throughput real-time performance)
face_detector = FaceDetector()
face_tracker = FaceTracker(max_disappeared=settings.MAX_FACE_DISAPPEARED_FRAMES)
landmark_detector = LandmarkDetector(static_image_mode=False)
feature_extractor = GeometricFeatureExtractor()
emotion_classifier = EmotionClassifier()

def decode_image_base64(base64_str: str) -> np.ndarray:
    """Decodes a base64-encoded image string (with or without data URL prefix) to BGR OpenCV image."""
    try:
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_bytes = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Decoded image is None or invalid format.")
        return img_bgr
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image base64 data: {e}")

def decode_uploaded_file(file_bytes: bytes) -> np.ndarray:
    """Decodes uploaded file bytes into OpenCV BGR format."""
    try:
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Could not decode file into a valid image.")
        return img_bgr
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

# ==================== Health & Model Status ====================

@router.get("/health", response_model=SystemHealthResponse)
def health_check(db: Session = Depends(get_db)):
    db_connected = False
    try:
        db.execute(SessionModel.__table__.select().limit(1))
        db_connected = True
    except Exception:
        db_connected = False

    model_status = ModelStatusResponse(
        model_loaded=emotion_classifier.is_loaded,
        model_path=emotion_classifier.model_path,
        emotion_classes=emotion_classifier.emotion_classes,
        input_shape=[1, 48, 48, 1],
        status_message="Model loaded and operational." if emotion_classifier.is_loaded else "EMOTION MODEL NOT AVAILABLE. Please train or provide models/emotion_model.keras."
    )

    return SystemHealthResponse(
        status="healthy",
        version=settings.VERSION,
        timestamp=datetime.datetime.utcnow(),
        model_status=model_status,
        database_connected=db_connected
    )

@router.get("/model/status", response_model=ModelStatusResponse)
def get_model_status():
    return ModelStatusResponse(
        model_loaded=emotion_classifier.is_loaded,
        model_path=emotion_classifier.model_path,
        emotion_classes=emotion_classifier.emotion_classes,
        input_shape=[1, 48, 48, 1],
        status_message="Model loaded and operational." if emotion_classifier.is_loaded else "EMOTION MODEL NOT AVAILABLE. Please train or provide models/emotion_model.keras."
    )

# ==================== Sessions Management ====================

@router.post("/session/start", response_model=SessionResponse)
def start_session(request: Optional[SessionCreateRequest] = None, db: Session = Depends(get_db)):
    session_uuid = str(uuid.uuid4())
    notes = request.notes if request else None
    
    new_session = SessionModel(
        session_uuid=session_uuid,
        started_at=datetime.datetime.utcnow(),
        duration_seconds=0.0,
        total_faces_detected=0,
        total_observations=0,
        notes=notes
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Reset face tracker for a clean session
    face_tracker.reset()
    emotion_classifier.reset_smoothing()

    return new_session

@router.post("/session/stop", response_model=SessionResponse)
def stop_session(request: SessionStopRequest, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.session_uuid == request.session_uuid).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")

    ended_time = datetime.datetime.utcnow()
    duration = (ended_time - session_obj.started_at).total_seconds()
    
    total_faces = db.query(FaceModel).filter(FaceModel.session_id == session_obj.id).count()
    total_obs = db.query(EmotionRecordModel).filter(EmotionRecordModel.session_id == session_obj.id).count()

    session_obj.ended_at = ended_time
    session_obj.duration_seconds = max(0.0, duration)
    session_obj.total_faces_detected = total_faces
    session_obj.total_observations = total_obs

    db.commit()
    db.refresh(session_obj)
    return session_obj

# ==================== Real-Time Emotion Prediction ====================

@router.post("/emotion/predict", response_model=PredictionResponse)
def predict_emotion_frame(req: PredictionRequest, db: Session = Depends(get_db)):
    img_bgr = decode_image_base64(req.image_base64)
    h_img, w_img = img_bgr.shape[:2]

    # 1. Face Detection
    raw_bboxes = face_detector.detect_faces(img_bgr)
    
    # 2. Face Tracking (keeps Face 1, Face 2 consistent)
    tracked_faces = face_tracker.update(raw_bboxes)

    # 3. MediaPipe Landmark processing (RGB format)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    mesh_results = landmark_detector.process_frame(img_rgb) if req.return_landmarks else None

    # Retrieve session object if provided
    current_session = None
    if req.session_uuid:
        current_session = db.query(SessionModel).filter(SessionModel.session_uuid == req.session_uuid).first()

    results: List[FaceDetectionResult] = []

    for (face_id, face_identifier, bbox) in tracked_faces:
        x, y, w, h = bbox
        
        # Face crop for CNN
        face_crop = img_bgr[y:y+h, x:x+w]

        # Landmark detection
        landmarks_2d = None
        if mesh_results:
            landmarks_2d = landmark_detector.get_landmarks_for_face(mesh_results, bbox, (h_img, w_img))

        # Geometric feature extraction
        geom_features = feature_extractor.extract_features(landmarks_2d, bbox, (h_img, w_img))

        # CNN Emotion Recognition
        if emotion_classifier.is_loaded:
            pred_tuple = emotion_classifier.predict(face_crop, face_id=face_id, apply_smoothing=req.smoothing)
            if pred_tuple:
                emotion, confidence, prob_dict = pred_tuple
            else:
                emotion = "Unclassified"
                confidence = 0.0
                prob_dict = {cls: 0.0 for cls in settings.EMOTION_CLASSES}
        else:
            emotion = "MODEL_UNAVAILABLE"
            confidence = 0.0
            prob_dict = {cls: 0.0 for cls in settings.EMOTION_CLASSES}

        # Store to DB if session active and saving enabled
        if req.save_record and current_session and emotion_classifier.is_loaded and emotion != "MODEL_UNAVAILABLE":
            # Record or update Face in DB
            db_face = (
                db.query(FaceModel)
                .filter(FaceModel.session_id == current_session.id, FaceModel.face_identifier == face_identifier)
                .first()
            )
            now_dt = datetime.datetime.utcnow()
            if not db_face:
                db_face = FaceModel(
                    session_id=current_session.id,
                    face_identifier=face_identifier,
                    first_seen=now_dt,
                    last_seen=now_dt,
                    total_observations=1
                )
                db.add(db_face)
                db.flush()
            else:
                db_face.last_seen = now_dt
                db_face.total_observations += 1

            # Insert Emotion Record
            rec = EmotionRecordModel(
                session_id=current_session.id,
                face_id=db_face.id,
                face_identifier=face_identifier,
                timestamp=now_dt,
                emotion=emotion,
                confidence=confidence,
                probabilities_json=json.dumps(prob_dict),
                geometric_features_json=json.dumps(geom_features.dict()) if geom_features else None,
                bounding_box_json=json.dumps([x, y, w, h])
            )
            db.add(rec)
            current_session.total_observations += 1
            db.commit()

        results.append(
            FaceDetectionResult(
                face_id=face_id,
                face_identifier=face_identifier,
                bounding_box=BoundingBox(x=x, y=y, width=w, height=h),
                emotion=emotion,
                confidence=confidence,
                probabilities=prob_dict,
                geometric_features=geom_features,
                landmarks_2d=landmarks_2d if req.return_landmarks else None
            )
        )

    status_msg = "Success"
    if not emotion_classifier.is_loaded:
        status_msg = "EMOTION MODEL NOT AVAILABLE. Please train the CNN model or verify models/emotion_model.keras."
    elif len(results) == 0:
        status_msg = "No faces detected in the current frame."

    return PredictionResponse(
        timestamp=datetime.datetime.utcnow(),
        model_available=emotion_classifier.is_loaded,
        faces_count=len(results),
        faces=results,
        status_message=status_msg
    )

@router.post("/emotion/predict-file", response_model=PredictionResponse)
async def predict_uploaded_image(
    file: UploadFile = File(...),
    smoothing: bool = Form(False),
    return_landmarks: bool = Form(True)
):
    """
    Dedicated endpoint for Model Testing page image uploads.
    Detects all faces in the uploaded image and returns full CNN probabilities and geometric features.
    """
    contents = await file.read()
    img_bgr = decode_uploaded_file(contents)
    h_img, w_img = img_bgr.shape[:2]

    raw_bboxes = face_detector.detect_faces(img_bgr)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    mesh_results = landmark_detector.process_frame(img_rgb) if return_landmarks else None

    results: List[FaceDetectionResult] = []

    for idx, bbox in enumerate(raw_bboxes, start=1):
        x, y, w, h = bbox
        face_crop = img_bgr[y:y+h, x:x+w]
        face_identifier = f"Face {idx}"

        landmarks_2d = None
        if mesh_results:
            landmarks_2d = landmark_detector.get_landmarks_for_face(mesh_results, bbox, (h_img, w_img))

        geom_features = feature_extractor.extract_features(landmarks_2d, bbox, (h_img, w_img))

        if emotion_classifier.is_loaded:
            pred_tuple = emotion_classifier.predict(face_crop, face_id=None, apply_smoothing=False)
            if pred_tuple:
                emotion, confidence, prob_dict = pred_tuple
            else:
                emotion = "Unclassified"
                confidence = 0.0
                prob_dict = {cls: 0.0 for cls in settings.EMOTION_CLASSES}
        else:
            emotion = "MODEL_UNAVAILABLE"
            confidence = 0.0
            prob_dict = {cls: 0.0 for cls in settings.EMOTION_CLASSES}

        results.append(
            FaceDetectionResult(
                face_id=idx,
                face_identifier=face_identifier,
                bounding_box=BoundingBox(x=x, y=y, width=w, height=h),
                emotion=emotion,
                confidence=confidence,
                probabilities=prob_dict,
                geometric_features=geom_features,
                landmarks_2d=landmarks_2d
            )
        )

    status_msg = f"Processed {len(results)} face(s)." if len(results) > 0 else "No face detected in uploaded image."
    if not emotion_classifier.is_loaded:
        status_msg = "EMOTION MODEL NOT AVAILABLE. Please train the CNN model or verify models/emotion_model.keras."

    return PredictionResponse(
        timestamp=datetime.datetime.utcnow(),
        model_available=emotion_classifier.is_loaded,
        faces_count=len(results),
        faces=results,
        status_message=status_msg
    )

# ==================== History & Analytics ====================

@router.get("/history", response_model=HistoryListResponse)
def get_history(
    session_id: Optional[int] = Query(None),
    session_uuid: Optional[str] = Query(None),
    face_identifier: Optional[str] = Query(None),
    emotion: Optional[str] = Query(None),
    min_confidence: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    filter_params = HistoryFilter(
        session_id=session_id,
        session_uuid=session_uuid,
        face_identifier=face_identifier,
        emotion=emotion,
        min_confidence=min_confidence,
        page=page,
        page_size=page_size
    )
    return AnalyticsEngine.filter_history(db, filter_params)

@router.get("/history/sessions", response_model=List[SessionResponse])
def get_all_sessions(db: Session = Depends(get_db)):
    sessions = db.query(SessionModel).order_by(desc(SessionModel.started_at)).all()
    return sessions

@router.get("/history/session/{session_uuid}", response_model=SessionResponse)
def get_session_by_uuid(session_uuid: str, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.session_uuid == session_uuid).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session_obj

@router.delete("/history/session/{session_uuid}")
def delete_session(session_uuid: str, db: Session = Depends(get_db)):
    session_obj = db.query(SessionModel).filter(SessionModel.session_uuid == session_uuid).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found.")
    db.delete(session_obj)
    db.commit()
    return {"status": "success", "message": f"Session {session_uuid} and associated records deleted."}

@router.delete("/history")
def delete_all_history(db: Session = Depends(get_db)):
    """Privacy control: Deletes all recorded sessions, faces, and observations."""
    db.query(EmotionRecordModel).delete()
    db.query(FaceModel).delete()
    db.query(SessionModel).delete()
    db.commit()
    return {"status": "success", "message": "All history and observation records permanently deleted."}

@router.get("/analytics", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    return AnalyticsEngine.get_overview(db)

@router.get("/analytics/trends", response_model=EmotionTrendsResponse)
def get_emotion_trends(
    session_uuid: Optional[str] = Query(None),
    time_window: str = Query("all"),
    db: Session = Depends(get_db)
):
    return AnalyticsEngine.get_trends(db, session_uuid=session_uuid, time_window=time_window)

@router.get("/insights", response_model=AIInsightResponse)
def get_insights(session_uuid: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return InsightsEngine.generate_session_insights(db, session_uuid=session_uuid)
