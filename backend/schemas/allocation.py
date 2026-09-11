from pydantic import BaseModel, Field

class AllocationInput(BaseModel):
    available_taxis: int = Field(..., ge=1, le=10000)
    hours: int = Field(24, ge=1, le=72)
    top_zones: int = Field(5, ge=1, le=10)
