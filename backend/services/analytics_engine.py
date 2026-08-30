import json
import datetime
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.core.config import settings
from backend.db.models import SessionModel, FaceModel, EmotionRecordModel
from backend.schemas.schemas import (
    AnalyticsOverviewResponse,
    EmotionDistributionItem,
    EmotionTrendPoint,
    EmotionTrendsResponse,
    EmotionTransitionMatrix,
    EmotionRecordResponse,
    HistoryFilter,
    HistoryListResponse,
    BoundingBox,
    GeometricFeatures
)

class AnalyticsEngine:
    """
    Computes rigorous statistical analytics and aggregations directly from SQLite database records.
    No simulated or hardcoded values.
    """

    @staticmethod
    def get_overview(db: Session) -> AnalyticsOverviewResponse:
        total_sessions = db.query(SessionModel).count()
        total_observations = db.query(EmotionRecordModel).count()
        total_faces_detected = db.query(FaceModel).count()

        # Average confidence
        avg_conf_query = db.query(func.avg(EmotionRecordModel.confidence)).scalar()
        avg_confidence = round(float(avg_conf_query), 4) if avg_conf_query is not None else 0.0

        # Average session duration
        completed_sessions = db.query(SessionModel).filter(SessionModel.duration_seconds > 0).all()
        if completed_sessions:
            avg_duration = round(sum(s.duration_seconds for s in completed_sessions) / len(completed_sessions), 1)
        else:
            avg_duration = 0.0

        # Emotion distribution
        distribution: List[EmotionDistributionItem] = []
        predominant_emotion = None
        predominant_percentage = 0.0

        if total_observations > 0:
            counts = (
                db.query(EmotionRecordModel.emotion, func.count(EmotionRecordModel.id))
                .group_by(EmotionRecordModel.emotion)
                .all()
            )
            count_map = {emotion: cnt for emotion, cnt in counts}

            for emo_class in settings.EMOTION_CLASSES:
                cnt = count_map.get(emo_class, 0)
                pct = round((cnt / total_observations) * 100.0, 1)
                distribution.append(
                    EmotionDistributionItem(
                        emotion=emo_class,
                        count=cnt,
                        percentage=pct,
                        color=settings.EMOTION_COLORS.get(emo_class, "#6B7280")
                    )
                )

            # Determine predominant emotion
            if counts:
                top_emo, top_cnt = max(counts, key=lambda x: x[1])
                predominant_emotion = top_emo
                predominant_percentage = round((top_cnt / total_observations) * 100.0, 1)
        else:
            for emo_class in settings.EMOTION_CLASSES:
                distribution.append(
                    EmotionDistributionItem(
                        emotion=emo_class,
                        count=0,
                        percentage=0.0,
                        color=settings.EMOTION_COLORS.get(emo_class, "#6B7280")
                    )
                )

        # Transition matrix calculation
        transitions = AnalyticsEngine.get_transition_matrix(db)

        return AnalyticsOverviewResponse(
            total_sessions=total_sessions,
            total_observations=total_observations,
            total_faces_detected=total_faces_detected,
            average_confidence=avg_confidence,
            average_session_duration_seconds=avg_duration,
            predominant_emotion=predominant_emotion,
            predominant_emotion_percentage=predominant_percentage,
            distribution=distribution,
            transitions=transitions,
            disclaimer=settings.SCIENTIFIC_DISCLAIMER
        )

    @staticmethod
    def get_transition_matrix(db: Session, session_id: Optional[int] = None) -> EmotionTransitionMatrix:
        """
        Computes transition frequency matrix P(E_t -> E_{t+1}) for consecutive observations.
        """
        classes = settings.EMOTION_CLASSES
        matrix: Dict[str, Dict[str, int]] = {
            src: {dst: 0 for dst in classes} for src in classes
        }

        query = db.query(EmotionRecordModel.face_identifier, EmotionRecordModel.emotion, EmotionRecordModel.timestamp)
        if session_id is not None:
            query = query.filter(EmotionRecordModel.session_id == session_id)
        
        records = query.order_by(EmotionRecordModel.face_identifier, EmotionRecordModel.timestamp).all()

        last_face = None
        last_emotion = None

        for face_id, emotion, _ in records:
            if face_id == last_face and last_emotion is not None:
                if last_emotion in matrix and emotion in matrix[last_emotion]:
                    matrix[last_emotion][emotion] += 1
            last_face = face_id
            last_emotion = emotion

        return EmotionTransitionMatrix(emotions=classes, matrix=matrix)

    @staticmethod
    def get_trends(
        db: Session,
        session_uuid: Optional[str] = None,
        time_window: str = "all"
    ) -> EmotionTrendsResponse:
        """
        Retrieves real-time or historical emotion trend points across time windows.
        """
        query = db.query(EmotionRecordModel).join(SessionModel)

        if session_uuid:
            query = query.filter(SessionModel.session_uuid == session_uuid)
        elif time_window == "1m":
            cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
            query = query.filter(EmotionRecordModel.timestamp >= cutoff)
        elif time_window == "5m":
            cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
            query = query.filter(EmotionRecordModel.timestamp >= cutoff)
        elif time_window == "today":
            cutoff = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(EmotionRecordModel.timestamp >= cutoff)

        records = query.order_by(EmotionRecordModel.timestamp.asc()).limit(500).all()

        points: List[EmotionTrendPoint] = []
        for r in records:
            try:
                probs = json.loads(r.probabilities_json)
            except Exception:
                probs = {}

            points.append(
                EmotionTrendPoint(
                    timestamp=r.timestamp.strftime("%H:%M:%S"),
                    face_identifier=r.face_identifier,
                    emotion=r.emotion,
                    confidence=r.confidence,
                    Happy=float(probs.get("Happy", 0.0)),
                    Sad=float(probs.get("Sad", 0.0)),
                    Angry=float(probs.get("Angry", 0.0)),
                    Fear=float(probs.get("Fear", 0.0)),
                    Surprise=float(probs.get("Surprise", 0.0)),
                    Neutral=float(probs.get("Neutral", 0.0)),
                    Disgust=float(probs.get("Disgust", 0.0))
                )
            )

        return EmotionTrendsResponse(time_window=time_window, points=points)

    @staticmethod
    def filter_history(db: Session, filter_params: HistoryFilter) -> HistoryListResponse:
        """
        Retrieves paginated and filtered historical records.
        """
        query = db.query(EmotionRecordModel).join(SessionModel)

        if filter_params.session_id is not None:
            query = query.filter(EmotionRecordModel.session_id == filter_params.session_id)
        if filter_params.session_uuid:
            query = query.filter(SessionModel.session_uuid == filter_params.session_uuid)
        if filter_params.face_identifier:
            query = query.filter(EmotionRecordModel.face_identifier == filter_params.face_identifier)
        if filter_params.emotion:
            query = query.filter(EmotionRecordModel.emotion == filter_params.emotion)
        if filter_params.min_confidence is not None:
            query = query.filter(EmotionRecordModel.confidence >= filter_params.min_confidence)
        if filter_params.start_time:
            query = query.filter(EmotionRecordModel.timestamp >= filter_params.start_time)
        if filter_params.end_time:
            query = query.filter(EmotionRecordModel.timestamp <= filter_params.end_time)

        total_records = query.count()

        offset = (filter_params.page - 1) * filter_params.page_size
        records = (
            query.order_by(desc(EmotionRecordModel.timestamp))
            .offset(offset)
            .limit(filter_params.page_size)
            .all()
        )

        response_records = []
        for r in records:
            probs = json.loads(r.probabilities_json) if r.probabilities_json else {}
            geom = json.loads(r.geometric_features_json) if r.geometric_features_json else None
            bbox = json.loads(r.bounding_box_json) if r.bounding_box_json else None

            bbox_obj = BoundingBox(x=bbox[0], y=bbox[1], width=bbox[2], height=bbox[3]) if bbox and len(bbox) == 4 else None
            geom_obj = GeometricFeatures(**geom) if geom else None

            response_records.append(
                EmotionRecordResponse(
                    id=r.id,
                    session_id=r.session_id,
                    face_id=r.face_id,
                    face_identifier=r.face_identifier,
                    timestamp=r.timestamp,
                    emotion=r.emotion,
                    confidence=r.confidence,
                    probabilities=probs,
                    bounding_box=bbox_obj,
                    geometric_features=geom_obj
                )
            )

        return HistoryListResponse(
            total_records=total_records,
            page=filter_params.page,
            page_size=filter_params.page_size,
            records=response_records
        )
