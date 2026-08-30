import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Real-Time Facial Emotion Recognition and Analysis System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./emotion_ai.db")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/emotion_model.keras")
    
    # Standard FER-2013 7 Emotion Classes (0: Angry, 1: Disgust, 2: Fear, 3: Happy, 4: Sad, 5: Surprise, 6: Neutral)
    EMOTION_CLASSES: List[str] = [
        "Angry",
        "Disgust",
        "Fear",
        "Happy",
        "Sad",
        "Surprise",
        "Neutral"
    ]
    
    # Priority colors & metadata for frontend dashboard
    EMOTION_COLORS: dict = {
        "Happy": "#10B981",    # Emerald
        "Neutral": "#6B7280",  # Gray
        "Surprise": "#F59E0B", # Amber
        "Sad": "#3B82F6",      # Blue
        "Fear": "#8B5CF6",     # Purple
        "Angry": "#EF4444",    # Red
        "Disgust": "#EC4899"   # Pink
    }
    
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*"
        ).split(",")
        if origin.strip()
    ]
    
    TEMPORAL_SMOOTHING_WINDOW: int = 5
    DEFAULT_CONFIDENCE_THRESHOLD: float = 0.35
    FACE_MATCH_IOU_THRESHOLD: float = 0.4
    MAX_FACE_DISAPPEARED_FRAMES: int = 15
    
    SCIENTIFIC_DISCLAIMER: str = (
        "This system estimates visible facial expressions from image data. "
        "Facial-expression recognition does not reliably determine a person's internal emotional or mental state."
    )

    class Config:
        case_sensitive = True

settings = Settings()
