from fastapi import APIRouter
from backend.services.data_service import model_results, quality_summary

router = APIRouter(prefix="/api/models", tags=["Models"])


@router.get("")
def get_models():
    return model_results()


@router.get("/quality")
def get_quality():
    return quality_summary()
