import pytest
import datetime
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base
from backend.db.models import SessionModel, FaceModel, EmotionRecordModel
from backend.services.analytics_engine import AnalyticsEngine
from backend.services.insights_engine import InsightsEngine

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_analytics_empty_db(test_db):
    overview = AnalyticsEngine.get_overview(test_db)
    assert overview.total_sessions == 0
    assert overview.total_observations == 0
    assert overview.average_confidence == 0.0
    assert len(overview.distribution) == 7

def test_analytics_and_insights_populated(test_db):
    # 1. Insert session
    session = SessionModel(
        session_uuid="insight-test-uuid",
        started_at=datetime.datetime.utcnow(),
        duration_seconds=60.0
    )
    test_db.add(session)
    test_db.commit()

    # 2. Insert records: 6 Happy, 2 Neutral, 1 Surprise
    emotions = ["Happy", "Happy", "Happy", "Happy", "Happy", "Happy", "Neutral", "Neutral", "Surprise"]
    for i, emo in enumerate(emotions):
        rec = EmotionRecordModel(
            session_id=session.id,
            face_identifier="Face 1",
            timestamp=datetime.datetime.utcnow() + datetime.timedelta(seconds=i),
            emotion=emo,
            confidence=0.85 if emo == "Happy" else 0.70,
            probabilities_json=json.dumps({emo: 0.85, "Neutral": 0.15})
        )
        test_db.add(rec)
    test_db.commit()

    # 3. Overview Analytics
    overview = AnalyticsEngine.get_overview(test_db)
    assert overview.total_observations == 9
    assert overview.predominant_emotion == "Happy"
    assert overview.predominant_emotion_percentage == round((6 / 9) * 100.0, 1)

    # 4. Insights Generation
    insights_res = InsightsEngine.generate_session_insights(test_db, session_uuid="insight-test-uuid")
    assert insights_res.has_sufficient_data is True
    assert insights_res.predominant_emotion == "Happy"
    assert len(insights_res.insights) > 0
    assert "Happy" in insights_res.insights[0]

    # Verify no forbidden medical words
    forbidden_terms = ["depression", "anxiety", "mental illness", "disorder", "psychological"]
    for insight in insights_res.insights:
        for term in forbidden_terms:
            assert term not in insight.lower()
