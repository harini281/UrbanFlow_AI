from fastapi import APIRouter
from backend.services.data_service import dashboard_summary
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
@router.get("/summary")
def summary():
    return dashboard_summary()
