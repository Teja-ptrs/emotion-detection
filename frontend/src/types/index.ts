export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeometricFeatures {
  eye_openness_left?: number;
  eye_openness_right?: number;
  eye_openness_avg?: number;
  mouth_openness?: number;
  mouth_width?: number;
  eyebrow_raise_left?: number;
  eyebrow_raise_right?: number;
  eyebrow_elevation_avg?: number;
  eye_distance?: number;
  face_width?: number;
  face_height?: number;
  face_aspect_ratio?: number;
  jaw_position?: number;
  nose_to_mouth_distance?: number;
  nose_wrinkle?: number;
}

export interface FaceDetectionResult {
  face_id: number;
  face_identifier: string;
  bounding_box: BoundingBox;
  emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  geometric_features?: GeometricFeatures;
  landmarks_2d?: number[][]; // [[x, y], ...]
}

export interface PredictionResponse {
  timestamp: string;
  model_available: boolean;
  faces_count: number;
  faces: FaceDetectionResult[];
  status_message: string;
}

export interface Session {
  id: number;
  session_uuid: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  total_faces_detected: number;
  total_observations: number;
  notes?: string;
}

export interface EmotionRecord {
  id: number;
  session_id: number;
  face_id?: number;
  face_identifier: string;
  timestamp: string;
  emotion: string;
  confidence: number;
  probabilities: Record<string, number>;
  bounding_box?: BoundingBox;
  geometric_features?: GeometricFeatures;
}

export interface EmotionDistributionItem {
  emotion: string;
  count: number;
  percentage: number;
  color: string;
}

export interface EmotionTrendPoint {
  timestamp: string;
  face_identifier: string;
  emotion: string;
  confidence: number;
  Happy: number;
  Sad: number;
  Angry: number;
  Fear: number;
  Surprise: number;
  Neutral: number;
  Disgust: number;
}

export interface EmotionTrendsResponse {
  time_window: string;
  points: EmotionTrendPoint[];
}

export interface EmotionTransitionMatrix {
  emotions: string[];
  matrix: Record<string, Record<string, number>>;
}

export interface AnalyticsOverview {
  total_sessions: number;
  total_observations: number;
  total_faces_detected: number;
  average_confidence: number;
  average_session_duration_seconds: number;
  predominant_emotion?: string;
  predominant_emotion_percentage: number;
  distribution: EmotionDistributionItem[];
  transitions?: EmotionTransitionMatrix;
  disclaimer: string;
}

export interface AIInsightResponse {
  session_uuid?: string;
  total_observations: number;
  predominant_emotion?: string;
  predominant_percentage: number;
  average_confidence: number;
  insights: string[];
  has_sufficient_data: boolean;
  scientific_disclaimer: string;
}

export interface ModelStatus {
  model_loaded: boolean;
  model_path: string;
  emotion_classes: string[];
  input_shape: number[];
  status_message: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  timestamp: string;
  model_status: ModelStatus;
  database_connected: boolean;
}

export interface AppSettings {
  selectedCameraId: string;
  showLandmarks: boolean;
  showConfidence: boolean;
  predictionFps: number;
  predictionSmoothing: boolean;
  enableHistory: boolean;
  autoSaveSession: boolean;
  theme: 'dark' | 'light';
}

export type ActiveTab = 
  | 'live' 
  | 'dashboard' 
  | 'history' 
  | 'analytics' 
  | 'testing' 
  | 'insights' 
  | 'privacy' 
  | 'settings';
