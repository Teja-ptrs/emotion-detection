import pytest
import datetime
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.core.database import Base
from backend.db.models import SessionModel, FaceModel, EmotionRecordModel

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_session_lifecycle(db_session):
    # 1. Create session
    session = SessionModel(
        session_uuid="test-uuid-1234",
        started_at=datetime.datetime.utcnow(),
        notes="Automated test session"
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    assert session.id is not None
    assert session.session_uuid == "test-uuid-1234"

    # 2. Add Face
    face = FaceModel(
        session_id=session.id,
        face_identifier="Face 1",
        first_seen=datetime.datetime.utcnow(),
        last_seen=datetime.datetime.utcnow(),
        total_observations=1
    )
    db_session.add(face)
    db_session.commit()
    db_session.refresh(face)

    assert face.id is not None
    assert face.session_id == session.id

    # 3. Add Emotion Record
    probs = {"Angry": 0.05, "Disgust": 0.01, "Fear": 0.02, "Happy": 0.85, "Sad": 0.02, "Surprise": 0.02, "Neutral": 0.03}
    record = EmotionRecordModel(
        session_id=session.id,
        face_id=face.id,
        face_identifier="Face 1",
        timestamp=datetime.datetime.utcnow(),
        emotion="Happy",
        confidence=0.85,
        probabilities_json=json.dumps(probs),
        bounding_box_json=json.dumps([100, 100, 80, 80])
    )
    db_session.add(record)
    session.total_observations = 1
    session.total_faces_detected = 1
    db_session.commit()
    db_session.refresh(record)

    assert record.id is not None
    assert record.emotion == "Happy"
    assert record.confidence == 0.85

    # 4. End session
    session.ended_at = datetime.datetime.utcnow()
    session.duration_seconds = 12.5
    db_session.commit()

    retrieved = db_session.query(SessionModel).filter_by(session_uuid="test-uuid-1234").first()
    assert retrieved.duration_seconds == 12.5
    assert len(retrieved.records) == 1
    assert len(retrieved.faces) == 1

def test_cascade_delete(db_session):
    session = SessionModel(session_uuid="cascade-test", started_at=datetime.datetime.utcnow())
    db_session.add(session)
    db_session.commit()

    face = FaceModel(session_id=session.id, face_identifier="Face 1", total_observations=1)
    db_session.add(face)
    db_session.commit()

    rec = EmotionRecordModel(
        session_id=session.id,
        face_id=face.id,
        face_identifier="Face 1",
        emotion="Neutral",
        confidence=0.74,
        probabilities_json="{}"
    )
    db_session.add(rec)
    db_session.commit()

    assert db_session.query(EmotionRecordModel).count() == 1

    # Delete session
    db_session.delete(session)
    db_session.commit()

    # Verify cascading deletion
    assert db_session.query(FaceModel).count() == 0
    assert db_session.query(EmotionRecordModel).count() == 0
