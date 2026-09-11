import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.routes import (
    dashboard,
    zones,
    flows,
    demand,
    prediction,
    allocation,
    models,
)

app = FastAPI(
    title="UrbanFlow AI",
    description="Urban mobility analytics and predictive operations platform",
    version="1.0.0",
)

# ============================================================
# CORS (Configurable for Production & Local Development)
# ============================================================

cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()

if cors_origins_env == "*" or not cors_origins_env:
    allow_origins = ["*"]
    allow_credentials = False
else:
    allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    for local_origin in [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
    ]:
        if local_origin not in allow_origins:
            allow_origins.append(local_origin)
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# API ROUTES
# ============================================================

app.include_router(dashboard.router)
app.include_router(zones.router)
app.include_router(flows.router)
app.include_router(demand.router)
app.include_router(prediction.router)
app.include_router(allocation.router)
app.include_router(models.router)

# ============================================================
# SYSTEM & HEALTH
# ============================================================

@app.get("/api/health", tags=["System"])
def health():
    return {
        "status": "healthy",
        "service": "UrbanFlow AI",
        "version": "1.0.0",
    }

# ============================================================
# STATIC / SPA FRONTEND SERVING (For Unified Production Hosting)
# ============================================================

FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        candidate = FRONTEND_DIST / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/", tags=["System"])
    def root():
        return {
            "name": "UrbanFlow AI",
            "docs": "/docs",
            "health": "/api/health",
        }