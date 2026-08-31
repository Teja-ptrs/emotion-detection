import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

# Mount static assets and SPA fallback
dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
assets_path = os.path.join(dist_path, "assets")

if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="static-assets")

if os.path.exists(dist_path):
    from fastapi.responses import FileResponse
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to be handled by routers
        if full_path.startswith("api"):
            return None
        file_target = os.path.join(dist_path, full_path)
        if os.path.exists(file_target) and os.path.isfile(file_target):
            return FileResponse(file_target)
        return FileResponse(os.path.join(dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "7860"))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    print(f"Starting server on {host}:{port} (reload={reload})...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload)
