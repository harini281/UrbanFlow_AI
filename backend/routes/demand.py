from fastapi import APIRouter, Query
from backend.services.data_service import forecast
router = APIRouter(prefix="/api/demand", tags=["Demand"])
@router.get("/forecast")
def get_forecast(hours: int = Query(72, ge=1, le=72), zone_id: int | None = Query(None, ge=1)):
    return forecast(hours, zone_id)
