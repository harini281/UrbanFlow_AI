from fastapi import APIRouter, Query
from backend.services.data_service import zones, hotspots, am_pm
router = APIRouter(prefix="/api/zones", tags=["Zones"])
@router.get("")
def get_zones(limit: int = Query(50, ge=1, le=265)):
    return zones(limit)
@router.get("/hotspots")
def get_hotspots(limit: int = Query(15, ge=1, le=265)):
    return hotspots(limit)
@router.get("/am-pm")
def get_am_pm(limit: int = Query(15, ge=1, le=265)):
    return am_pm(limit)
