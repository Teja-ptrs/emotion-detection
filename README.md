# AI-Based Real-Time Facial Emotion Recognition and Analysis System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?logo=react)](https://react.dev)
[![TensorFlow](https://img.shields.io/badge/Model-TensorFlow_%2F_Keras-FF6F00?logo=tensorflow)](https://tensorflow.org)
[![MediaPipe](https://img.shields.io/badge/Landmarks-MediaPipe_FaceMesh-008080)](https://developers.google.com/mediapipe)
[![SQLite](https://img.shields.io/badge/Database-SQLite_%2B_SQLAlchemy-003B57?logo=sqlite)](https://sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

A production-grade, full-stack AI system for real-time facial expression classification, 468-point facial landmark geometry extraction, multi-person face tracking, session history management, real-time Recharts analytics, and statistically grounded AI insights.

---

## 📌 Scientific & Medical Disclaimer

> **IMPORTANT**: This system estimates visible facial expressions from image and video stream data. Facial-expression recognition does not reliably determine a person's internal emotional, psychological, or psychiatric state. This application is strictly an engineering and computer vision tool and makes no clinical or psychological diagnosis.

---

## 🌟 Key Features

1. **Real-Time Webcam Pipeline**:
   - High-throughput video frame processing (up to 20 FPS) via WebSockets and REST fallback.
   - OpenCV multi-face detection with boundary clamping and contrast normalization.
   - Centroid + IoU tracking engine maintaining consistent Face IDs (`Face 1`, `Face 2`, `Face 3`...) without spurious ID jumping.
2. **MediaPipe 468 3D Landmark Mesh & Geometry**:
   - Real-time 468-point facial mesh rendering with interactive toggle.
   - Normalized geometric feature extraction: eye openness (L/R/Avg), mouth openness, mouth width, eyebrow elevation (L/R/Avg), eye distance, face aspect ratio, jaw position, nose-to-mouth distance, and nose wrinkle index.
3. **Deep Learning CNN Emotion Recognition**:
   - Deep Convolutional Neural Network trained for 48×48 grayscale facial crops across all **7 original FER-2013 categories**:
     - `Angry`
     - `Disgust`
     - `Fear`
     - `Happy`
     - `Sad`
     - `Surprise`
     - `Neutral`
   - Real softmax output distribution vectors summing to 1.0.
   - Per-face temporal exponential smoothing buffer to eliminate jitter while preserving model uncertainty.
4. **Session & History Storage**:
   - SQLite relational database with SQLAlchemy ORM.
   - Complete session lifecycle (Start, Duration timer, Stop, Auto-logging).
   - Filterable & searchable history table by session, emotion, and confidence with pagination.
   - Full session detail inspection modal with individual softmax distributions.
5. **Real-Time Analytics & Trends**:
   - Recharts continuous live stream and historical time-series graphs with time windows (`Current Session`, `1m`, `5m`, `Today`, `All`).
   - Cumulative class frequency breakdown (Pie/Donut charts).
   - Sequential transition frequency matrix ($P(\text{Emotion}_t \to \text{Emotion}_{t+1})$).
6. **Fact-Based AI Insights Engine**:
   - Generates natural language summary statements grounded strictly in mathematical and statistical observations.
7. **Offline Model Testing Suite**:
   - Drag-and-drop or file upload testing on static images.
   - Multi-face bounding box isolation, 48×48 crop visualization, and softmax probability distributions.
8. **Privacy & Operational Settings**:
   - 100% local processing guarantee; no video frames are transmitted externally or written to disk.
   - One-click database purge and session deletion.
   - Configurable camera selection, landmark rendering toggle, confidence tag toggle, FPS throttling slider, and temporal smoothing toggle.

---

## 🏗️ System Architecture

```
Camera Input
      ↓
Face Detection (OpenCV Haar Cascade / MediaPipe)
      ↓
Face Tracking (Centroid & IoU Persistent IDs)
      ↓
Facial Landmark Detection (MediaPipe 468 Face Mesh)
      ↓
Geometric Feature Extraction (12 Normalized Ratios)
      ↓
Face Preprocessing (48×48 Grayscale Normalization)
      ↓
CNN Emotion Recognition (4 Conv-BN-ReLU-MaxPool-Dropout Blocks)
      ↓
Softmax Probabilities & Confidence
      ↓
Temporal Smoothing Buffer (Moving Window Average per Face ID)
      ↓
SQLite Database (Sessions, Faces, Emotion Records)
      ↓
Analytics Engine (Distributions, Transition Matrices, Trends)
      ↓
AI Insights Engine (Factual Summaries & Disclaimers)
      ↓
Professional React + Tailwind Dashboard
```

---

## 📂 Project Structure

```
emotion-ai/
├── backend/
│   ├── main.py                  # FastAPI assembly, lifespan, CORS, static mount
│   ├── core/
│   │   ├── config.py            # System configuration, classes, thresholds
│   │   └── database.py          # SQLAlchemy engine, sessionmaker, init_db
│   ├── db/
│   │   └── models.py            # SessionModel, FaceModel, EmotionRecordModel
│   ├── schemas/
│   │   └── schemas.py           # Pydantic request/response schemas
│   ├── services/
│   │   ├── face_detector.py     # OpenCV Haar face detection
│   │   ├── face_tracker.py      # Centroid + IoU multi-face tracker
│   │   ├── landmark_detector.py # MediaPipe 468 Face Mesh
│   │   ├── feature_extractor.py # Geometric landmark measurements
│   │   ├── emotion_classifier.py# CNN loader, preprocessing, inference & smoothing
│   │   ├── analytics_engine.py  # Statistical database aggregations & trends
│   │   └── insights_engine.py   # Statistical natural language insights
│   └── api/
│       ├── endpoints.py         # REST endpoints (health, sessions, predict, history, analytics)
│       └── websocket.py         # Bi-directional WebSocket stream endpoint
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main layout & navigation
│   │   ├── types/index.ts       # TypeScript interfaces
│   │   ├── services/
│   │   │   ├── api.ts           # REST API client
│   │   │   └── websocket.ts     # LiveStreamClient WebSocket wrapper
│   │   ├── hooks/
│   │   │   ├── useCamera.ts     # Camera capture & device enumeration
│   │   │   └── useLiveEmotion.ts# Live stream state, tracking, and trend history
│   │   ├── components/
│   │   │   ├── Layout/          # Sidebar, Header
│   │   │   ├── Live/            # CameraFeed, EmotionCard, ProbabilityBar, MultiFaceList, GeometricFeatures, SessionControls
│   │   │   └── Charts/          # EmotionTrendChart, EmotionPieChart
│   │   └── pages/               # LiveDetectionPage, DashboardPage, HistoryPage, AnalyticsPage, ModelTestingPage, AIInsightsPage, PrivacyPage, SettingsPage
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── training/
│   ├── cnn_model.py             # Keras CNN architecture definition
│   ├── dataset.py               # FER-2013 CSV / image directory parser
│   ├── preprocessing.py         # ImageDataGenerators & augmentations
│   ├── train_model.py           # Full training pipeline (Checkpoints, EarlyStopping, ReduceLR)
│   ├── evaluate_model.py        # Precision, recall, F1, and confusion matrix evaluation
│   ├── test_model.py            # CLI inference test on sample images
│   └── synthetic_demo_weights.py# Baseline CNN initialization script
│
├── models/
│   └── emotion_model.keras      # Trained Keras CNN model weights
├── data/
│   └── fer2013.csv              # FER-2013 dataset (optional for full training)
├── tests/                       # 15 automated unit & integration tests
├── requirements.txt
├── pytest.ini
├── .env.example
└── README.md
```

---

## 🚀 Quickstart & Running Instructions

### Prerequisites
- Python 3.11 or 3.12
- Node.js 18+ and npm
- Windows PowerShell / Terminal

---

### Step 1: Clone and Set Up Python Virtual Environment

```powershell
# Navigate to project directory
cd "c:\Users\pabhi\Desktop\emotion detection"

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
pip install -r requirements.txt
```

---

### Step 2: Set Up Frontend Dependencies and Build

```powershell
cd frontend
npm install
npm run build
cd ..
```

---

### Step 3: Initialize or Train the CNN Model

The system includes a pre-compiled baseline model generator so it is **immediately functional out-of-the-box**:

```powershell
# Generate / verify baseline model weights
python training/synthetic_demo_weights.py
```

#### Training on Full FER-2013 Dataset (Optional):
1. Download `fer2013.csv` from [Kaggle FER-2013 Challenge](https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge).
2. Place `fer2013.csv` into the `data/` folder (`data/fer2013.csv`).
3. Run the training script:
```powershell
python training/train_model.py --data data/fer2013.csv --epochs 50 --batch_size 64
```
4. Evaluate the model performance:
```powershell
python training/evaluate_model.py --model models/emotion_model.keras --data data/fer2013.csv
```

---

### Step 4: Run the Application

#### Option A: Single Integrated Server (Serves Backend & Built Frontend on port 8000)
```powershell
python backend/main.py
```
Open your browser and navigate to: **`http://localhost:8000`**

#### Option B: Full Development Mode (FastAPI Backend + Vite Hot Reload)
1. **Terminal 1 (Backend)**:
```powershell
.\venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
2. **Terminal 2 (Frontend)**:
```powershell
cd frontend
npm run dev
```
Open your browser and navigate to: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

Run the test suite covering database operations, CNN shapes, softmax constraints, face tracking, landmark geometry, analytics, and REST endpoints:

```powershell
.\venv\Scripts\pytest -v
```

Output:
```
tests/test_analytics_insights.py::test_analytics_empty_db PASSED
tests/test_analytics_insights.py::test_analytics_and_insights_populated PASSED
tests/test_api_endpoints.py::test_health_endpoint PASSED
tests/test_api_endpoints.py::test_model_status_endpoint PASSED
tests/test_api_endpoints.py::test_session_lifecycle_api PASSED
tests/test_api_endpoints.py::test_history_and_analytics_endpoints PASSED
tests/test_cnn_architecture.py::test_cnn_architecture_shapes PASSED
tests/test_cnn_architecture.py::test_cnn_forward_pass_probabilities PASSED
tests/test_database.py::test_session_lifecycle PASSED
tests/test_database.py::test_cascade_delete PASSED
tests/test_face_detector.py::test_face_detector_bounds PASSED
tests/test_face_detector.py::test_face_tracker_id_persistence PASSED
tests/test_face_detector.py::test_iou_calculation PASSED
tests/test_feature_extractor.py::test_feature_extractor_bounding_box_only PASSED
tests/test_feature_extractor.py::test_feature_extractor_with_mock_landmarks PASSED

======================== 15 passed in 8.21s ========================
```

---

## 📡 API Documentation

Interactive Swagger API docs are available at **`http://localhost:8000/docs`** and ReDoc at **`http://localhost:8000/redoc`**.

### Core Endpoints:
- `GET /api/health` — System status, database connection, and model operational telemetry.
- `GET /api/model/status` — Model loading state, weights path, and input specifications.
- `POST /api/session/start` — Starts a new recording session and returns session UUID.
- `POST /api/session/stop` — Concludes the session, records duration, and commits counts.
- `POST /api/emotion/predict` — Processes base64 video frame; runs detection, tracking, landmarks, geometry, and CNN classification.
- `POST /api/emotion/predict-file` — Multipart image upload for offline testing.
- `GET /api/history` — Filterable historical observation records with pagination.
- `DELETE /api/history/{session_uuid}` — Deletes single session and cascaded observations.
- `DELETE /api/history` — Permanent database purge (Privacy control).
- `GET /api/analytics` — Statistical distributions and emotion transition matrices.
- `GET /api/analytics/trends` — Chronological time-series points across custom windows.
- `GET /api/insights` — Statistical session summaries and observations.
- `WS /api/ws/stream` — Low-latency bi-directional WebSocket stream.

---

## 🛡️ Privacy & Local Data Processing

- **No Remote Video Transmission**: All processing happens locally on your machine.
- **No Frame Storage by Default**: Video frames exist transiently in RAM and are discarded immediately after inference.
- **Permanent Purge**: Users can delete individual sessions or clear all historical SQLite records from the Privacy or History pages.

---

## 📜 License & Acknowledgments

- **Dataset**: FER-2013 (Facial Expression Recognition Challenge).
- **Libraries**: TensorFlow, MediaPipe, OpenCV, FastAPI, SQLAlchemy, React, Vite, Tailwind CSS, Recharts.
