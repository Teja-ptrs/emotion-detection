#!/usr/bin/env bash
set -e

# If frontend/dist is missing, build it automatically on startup
if [ ! -f "frontend/dist/index.html" ]; then
    echo "[STARTUP] frontend/dist/index.html not found! Building frontend..."
    cd frontend && npm install && npm run build && cd ..
fi

echo "[STARTUP] Starting FastAPI backend with Uvicorn on port ${PORT:-8000}..."
exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
