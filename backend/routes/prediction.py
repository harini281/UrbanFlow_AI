from fastapi import APIRouter, HTTPException
from backend.schemas.prediction import PredictionInput
from backend.services.model_service import predict_fare, predict_eta, model_status
router = APIRouter(prefix="/api/predict", tags=["Predictions"])
@router.get("/status")
def status():
    return model_status()
@router.post("/fare")
def fare(payload: PredictionInput):
    try:
        return {"prediction_type":"base_fare","predicted_base_fare":round(predict_fare(payload.model_dump()),2),"currency":"USD"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Fare model unavailable. Repair the sklearn runtime/model artifact compatibility first. {exc}")
@router.post("/eta")
def eta(payload: PredictionInput):
    try:
        return {"prediction_type":"eta","predicted_duration_minutes":round(predict_eta(payload.model_dump()),2),"unit":"minutes"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"ETA model unavailable. Repair the sklearn runtime/model artifact compatibility first. {exc}")
