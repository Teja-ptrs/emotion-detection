from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Geometry and Features ---

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class GeometricFeatures(BaseModel):
    eye_openness_left: Optional[float] = Field(None, description="Normalized height/width ratio of left eye")
    eye_openness_right: Optional[float] = Field(None, description="Normalized height/width ratio of right eye")
    eye_openness_avg: Optional[float] = Field(None, description="Average eye openness")
    mouth_openness: Optional[float] = Field(None, description="Normalized mouth vertical opening")
    mouth_width: Optional[float] = Field(None, description="Normalized mouth corner distance")
    eyebrow_raise_left: Optional[float] = Field(None, description="Normalized left eyebrow-to-eye distance")
    eyebrow_raise_right: Optional[float] = Field(None, description="Normalized right eyebrow-to-eye distance")
    eyebrow_elevation_avg: Optional[float] = Field(None, description="Average eyebrow raise")
    eye_distance: Optional[float] = Field(None, description="Inter-pupil distance normalized by face width")
    face_width: Optional[float] = Field(None, description="Face bounding width in pixels")
    face_height: Optional[float] = Field(None, description="Face bounding height in pixels")
    face_aspect_ratio: Optional[float] = Field(None, description="Face height/width ratio")
    jaw_position: Optional[float] = Field(None, description="Normalized jaw lower elevation")
    nose_to_mouth_distance: Optional[float] = Field(None, description="Normalized distance from nose tip to upper lip")
    nose_wrinkle: Optional[float] = Field(None, description="Normalized nose bridge compression index")

# --- Face & Emotion Detection ---

class FaceDetectionResult(BaseModel):
    face_id: int
    face_identifier: str
    bounding_box: BoundingBox
    emotion: str
    confidence: float
    probabilities: Dict[str, float]
    geometric_features: Optional[GeometricFeatures] = None
    landmarks_2d: Optional[List[List[float]]] = None  # Normalized [x, y] coordinates for live mesh drawing

class PredictionRequest(BaseModel):
    image_base64: str
    session_uuid: Optional[str] = None
    smoothing: bool = True
    return_landmarks: bool = True
    save_record: bool = True

class PredictionResponse(BaseModel):
    timestamp: datetime
    model_available: bool
    faces_count: int
    faces: List[FaceDetectionResult]
    status_message: str

# --- Sessions & History ---

class SessionCreateRequest(BaseModel):
    notes: Optional[str] = None

class SessionResponse(BaseModel):
    id: int
    session_uuid: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: float
    total_faces_detected: int
    total_observations: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class SessionStopRequest(BaseModel):
    session_uuid: str

class EmotionRecordResponse(BaseModel):
    id: int
    session_id: int
    face_id: Optional[int] = None
    face_identifier: str
    timestamp: datetime
    emotion: str
    confidence: float
    probabilities: Dict[str, float]
    bounding_box: Optional[BoundingBox] = None
    geometric_features: Optional[GeometricFeatures] = None

    class Config:
        from_attributes = True

class HistoryFilter(BaseModel):
    session_id: Optional[int] = None
    session_uuid: Optional[str] = None
    face_identifier: Optional[str] = None
    emotion: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    min_confidence: Optional[float] = None
    page: int = 1
    page_size: int = 50

class HistoryListResponse(BaseModel):
    total_records: int
    page: int
    page_size: int
    records: List[EmotionRecordResponse]

# --- Analytics & Insights ---

class EmotionDistributionItem(BaseModel):
    emotion: str
    count: int
    percentage: float
    color: str

class EmotionTrendPoint(BaseModel):
    timestamp: str
    face_identifier: str
    emotion: str
    confidence: float
    Happy: float
    Sad: float
    Angry: float
    Fear: float
    Surprise: float
    Neutral: float
    Disgust: float

class EmotionTrendsResponse(BaseModel):
    time_window: str
    points: List[EmotionTrendPoint]

class EmotionTransitionMatrix(BaseModel):
    emotions: List[str]
    matrix: Dict[str, Dict[str, int]]  # {from_emotion: {to_emotion: count}}

class AnalyticsOverviewResponse(BaseModel):
    total_sessions: int
    total_observations: int
    total_faces_detected: int
    average_confidence: float
    average_session_duration_seconds: float
    predominant_emotion: Optional[str] = None
    predominant_emotion_percentage: float = 0.0
    distribution: List[EmotionDistributionItem]
    transitions: Optional[EmotionTransitionMatrix] = None
    disclaimer: str

class AIInsightResponse(BaseModel):
    session_uuid: Optional[str] = None
    total_observations: int
    predominant_emotion: Optional[str] = None
    predominant_percentage: float = 0.0
    average_confidence: float = 0.0
    insights: List[str]
    has_sufficient_data: bool
    scientific_disclaimer: str

# --- Status and System ---

class ModelStatusResponse(BaseModel):
    model_loaded: bool
    model_path: str
    emotion_classes: List[str]
    input_shape: List[int]
    status_message: str

class SystemHealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    model_status: ModelStatusResponse
    database_connected: bool
