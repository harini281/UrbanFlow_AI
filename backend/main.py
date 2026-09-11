from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
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
# SYSTEM
# ============================================================

@app.get("/api/health", tags=["System"])
def health():
    return {
        "status": "healthy",
        "service": "UrbanFlow AI",
        "version": "1.0.0",
    }


@app.get("/", tags=["System"])
def root():
    return {
        "name": "UrbanFlow AI",
        "docs": "/docs",
        "health": "/api/health",
    }