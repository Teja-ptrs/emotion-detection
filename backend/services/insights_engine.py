from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.core.config import settings
from backend.db.models import SessionModel, EmotionRecordModel, FaceModel
from backend.schemas.schemas import AIInsightResponse

class InsightsEngine:
    """
    Fact-based statistical insight generation engine.
    Derives clear, mathematically grounded descriptive statements from recorded session observations.
    Explicitly refrains from psychological, medical, or diagnostic claims.
    """

    MIN_OBSERVATIONS_THRESHOLD = 5

    @staticmethod
    def generate_session_insights(db: Session, session_uuid: Optional[str] = None) -> AIInsightResponse:
        # Build query
        query = db.query(EmotionRecordModel).join(SessionModel)
        if session_uuid:
            query = query.filter(SessionModel.session_uuid == session_uuid)

        total_obs = query.count()

        if total_obs < InsightsEngine.MIN_OBSERVATIONS_THRESHOLD:
            return AIInsightResponse(
                session_uuid=session_uuid,
                total_observations=total_obs,
                predominant_emotion=None,
                predominant_percentage=0.0,
                average_confidence=0.0,
                insights=["Not enough observations to generate reliable session insights."],
                has_sufficient_data=False,
                scientific_disclaimer=settings.SCIENTIFIC_DISCLAIMER
            )

        # 1. Distribution of emotions
        counts = (
            db.query(EmotionRecordModel.emotion, func.count(EmotionRecordModel.id))
            .join(SessionModel)
        )
        if session_uuid:
            counts = counts.filter(SessionModel.session_uuid == session_uuid)
        counts = counts.group_by(EmotionRecordModel.emotion).all()

        emotion_map = {emo: cnt for emo, cnt in counts}
        sorted_emotions = sorted(counts, key=lambda x: x[1], reverse=True)

        top_emotion, top_cnt = sorted_emotions[0]
        top_pct = round((top_cnt / total_obs) * 100.0, 1)

        # 2. Average confidence
        avg_conf_query = db.query(func.avg(EmotionRecordModel.confidence)).join(SessionModel)
        if session_uuid:
            avg_conf_query = avg_conf_query.filter(SessionModel.session_uuid == session_uuid)
        avg_conf = round(float(avg_conf_query.scalar() or 0.0) * 100.0, 1)

        # 3. Unique faces detected
        faces_count_query = db.query(func.count(func.distinct(EmotionRecordModel.face_identifier))).join(SessionModel)
        if session_uuid:
            faces_count_query = faces_count_query.filter(SessionModel.session_uuid == session_uuid)
        unique_faces = faces_count_query.scalar() or 1

        # Generate factual observations
        insights: List[str] = []

        # Predominant expression
        insights.append(
            f"'{top_emotion}' was the most frequently detected facial expression, representing {top_pct}% ({top_cnt} of {total_obs}) of all observations."
        )

        # Second most common or neutral breakdown
        if len(sorted_emotions) > 1:
            second_emo, second_cnt = sorted_emotions[1]
            second_pct = round((second_cnt / total_obs) * 100.0, 1)
            insights.append(
                f"'{second_emo}' was the second most frequent expression, comprising {second_pct}% ({second_cnt} observations)."
            )

        # Neutral expressions percentage
        neutral_cnt = emotion_map.get("Neutral", 0)
        if "Neutral" in emotion_map and top_emotion != "Neutral":
            neutral_pct = round((neutral_cnt / total_obs) * 100.0, 1)
            insights.append(
                f"Neutral baseline expressions were observed in {neutral_pct}% of frames."
            )

        # Multi-face observation
        if unique_faces > 1:
            insights.append(
                f"Multi-person tracking detected {unique_faces} distinct faces concurrently or sequentially in this session."
            )
        else:
            insights.append("Single-subject tracking was maintained consistently throughout the observation window.")

        # Confidence metric
        insights.append(
            f"Average CNN model classification confidence across all detections was {avg_conf}%."
        )

        # Expression variety index
        active_emotions_count = len([c for c in emotion_map.values() if c > 0])
        insights.append(
            f"A total of {active_emotions_count} distinct facial expression categories out of 7 were observed during this recording."
        )

        return AIInsightResponse(
            session_uuid=session_uuid,
            total_observations=total_obs,
            predominant_emotion=top_emotion,
            predominant_percentage=top_pct,
            average_confidence=avg_conf,
            insights=insights,
            has_sufficient_data=True,
            scientific_disclaimer=settings.SCIENTIFIC_DISCLAIMER
        )
