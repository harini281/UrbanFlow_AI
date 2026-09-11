from fastapi import APIRouter, Query
from backend.services.data_service import od_flows
router = APIRouter(prefix="/api/flows", tags=["OD Flows"])
@router.get("/od")
def get_od_flows(limit: int = Query(20, ge=1, le=500)):
    return od_flows(limit)
