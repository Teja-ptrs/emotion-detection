# ==========================================================
# Multi-Stage Production Dockerfile for Emotion AI
# Stage 1: Build React Frontend
# Stage 2: Python FastAPI Backend with TensorFlow & MediaPipe
# ==========================================================

# --- Stage 1: Frontend Build ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Python Runtime ---
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000 \
    HOST=0.0.0.0 \
    MODEL_PATH=models/emotion_model.keras \
    DATABASE_URL=sqlite:///./emotion_ai.db

WORKDIR /app

# Install minimal system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, models, and training assets
COPY backend/ ./backend/
COPY models/ ./models/
COPY training/ ./training/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose dynamic production port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Production entrypoint
CMD ["sh", "-c", "uvicorn backend.main:app --host ${HOST} --port ${PORT}"]
