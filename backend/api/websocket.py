import json
import datetime
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.db.models import SessionModel, FaceModel, EmotionRecordModel
from backend.schemas.schemas import BoundingBox, FaceDetectionResult
from backend.api.endpoints import (
    decode_image_base64,
    face_detector,
    face_tracker,
    landmark_detector,
    feature_extractor,
    emotion_classifier
)

ws_router = APIRouter()

@ws_router.websocket("/ws/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    db = SessionLocal()
    
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                payload = json.loads(data_text)
            except Exception:
                await websocket.send_json({"error": "Invalid JSON format."})
                continue

            image_base64 = payload.get("image_base64")
            if not image_base64:
                await websocket.send_json({"error": "Missing image_base64 field."})
                continue

            session_uuid = payload.get("session_uuid")
            smoothing = payload.get("smoothing", True)
            return_landmarks = payload.get("return_landmarks", True)
            save_record = payload.get("save_record", True)

            try:
                img_bgr = decode_image_base64(image_base64)
            except Exception as e:
                await websocket.send_json({"error": f"Image decode error: {e}"})
                continue

            h_img, w_img = img_bgr.shape[:2]

            # 1. Detection
            raw_bboxes = face_detector.detect_faces(img_bgr)
            # 2. Tracking
            tracked_faces = face_tracker.update(raw_bboxes)
            # 3. Landmarks
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            mesh_results = landmark_detector.process_frame(img_rgb) if return_landmarks else None

            # Retrieve active session
            current_session = None
            if session_uuid:
                current_session = db.query(SessionModel).filter(SessionModel.session_uuid == session_uuid).first()

            results = []

            for (face_id, face_identifier, bbox) in tracked_faces:
                x, y, w, h = bbox
                face_crop = img_bgr[y:y+h, x:x+w]

                landmarks_2d = None
                if mesh_results:
                    landmarks_2d = landmark_detector.get_landmarks_for_face(mesh_results, bbox, (h_img, w_img))

                geom_features = feature_extractor.extract_features(landmarks_2d, bbox, (h_img, w_img))

                if emotion_classifier.is_loaded:
                    pred_tuple = emotion_classifier.predict(face_crop, face_id=face_id, apply_smoothing=smoothing)
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

                # Save record if configured
                if save_record and current_session and emotion_classifier.is_loaded and emotion != "MODEL_UNAVAILABLE":
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

                results.append({
                    "face_id": face_id,
                    "face_identifier": face_identifier,
                    "bounding_box": {"x": x, "y": y, "width": w, "height": h},
                    "emotion": emotion,
                    "confidence": confidence,
                    "probabilities": prob_dict,
                    "geometric_features": geom_features.dict() if geom_features else None,
                    "landmarks_2d": landmarks_2d if return_landmarks else None
                })

            response = {
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "model_available": emotion_classifier.is_loaded,
                "faces_count": len(results),
                "faces": results,
                "status_message": "Success" if emotion_classifier.is_loaded else "EMOTION MODEL NOT AVAILABLE"
            }

            await websocket.send_json(response)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WebSocket] Exception: {e}")
    finally:
        db.close()
