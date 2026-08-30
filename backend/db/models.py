import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.core.database import Base

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_uuid = Column(String(64), unique=True, index=True, nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, default=0.0, nullable=False)
    total_faces_detected = Column(Integer, default=0, nullable=False)
    total_observations = Column(Integer, default=0, nullable=False)
    notes = Column(String(255), nullable=True)

    faces = relationship("FaceModel", back_populates="session", cascade="all, delete-orphan")
    records = relationship("EmotionRecordModel", back_populates="session", cascade="all, delete-orphan")

class FaceModel(Base):
    __tablename__ = "faces"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    face_identifier = Column(String(64), nullable=False) # e.g. "Face 1", "Face 2"
    first_seen = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    total_observations = Column(Integer, default=0, nullable=False)

    session = relationship("SessionModel", back_populates="faces")
    records = relationship("EmotionRecordModel", back_populates="face", cascade="all, delete-orphan")

class EmotionRecordModel(Base):
    __tablename__ = "emotion_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    face_id = Column(Integer, ForeignKey("faces.id", ondelete="CASCADE"), nullable=True, index=True)
    face_identifier = Column(String(64), nullable=False, default="Face 1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    emotion = Column(String(32), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    probabilities_json = Column(Text, nullable=False) # JSON: {"Happy": 0.85, "Neutral": 0.10, ...}
    geometric_features_json = Column(Text, nullable=True) # JSON of computed landmark features
    bounding_box_json = Column(Text, nullable=True) # JSON: [x, y, w, h]

    session = relationship("SessionModel", back_populates="records")
    face = relationship("FaceModel", back_populates="records")
