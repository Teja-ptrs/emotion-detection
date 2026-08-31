import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.core.config import settings
from backend.core.database import init_db
from backend.api.endpoints import router as api_router
from backend.api.websocket import ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    print(f"[{settings.PROJECT_NAME}] Initializing database...")
    init_db()
    print(f"[{settings.PROJECT_NAME}] Server initialized and ready.")
    yield
    # Shutdown logic if any
    print(f"[{settings.PROJECT_NAME}] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST and WebSocket routers
app.include_router(api_router, prefix=settings.API_PREFIX, tags=["Emotion Analysis API"])
app.include_router(ws_router, prefix=settings.API_PREFIX, tags=["Real-Time Stream"])

# Static frontend paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_path = os.path.join(BASE_DIR, "frontend", "dist")
assets_path = os.path.join(dist_path, "assets")

# Mount assets directory if present
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="static-assets")

# Explicit Root Route
@app.get("/", include_in_schema=False)
async def serve_root():
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse(
        status_code=503,
        content={
            "error": "Frontend build missing",
            "message": "frontend/dist/index.html was not found. Please ensure 'npm --prefix frontend install && npm --prefix frontend run build' is included in your Render Build Command."
        }
    )

# SPA Catch-all Route for client-side navigation (/live, /dashboard, /history, /analytics)
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_fallback(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    file_target = os.path.join(dist_path, full_path)
    if os.path.exists(file_target) and os.path.isfile(file_target):
        return FileResponse(file_target)

    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    raise HTTPException(status_code=404, detail=f"Path not found: {full_path}")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "7860"))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    print(f"Starting server on {host}:{port} (reload={reload})...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload)
