from datetime import datetime
from pydantic import BaseModel, Field

class PredictionInput(BaseModel):
    pickup_timestamp: datetime
    origin_loc_id: int = Field(..., ge=1)
    dest_loc_id: int = Field(..., ge=1)
    distance_miles: float = Field(..., ge=0)
    rider_count: float = Field(1, ge=0)
    provider_code: float = 1
    rate_class_id: float = 1
    offline_record_flag: str = "N"
