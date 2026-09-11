from fastapi import APIRouter
import pandas as pd
from backend.schemas.allocation import AllocationInput
from backend.services.data_service import read_csv

router = APIRouter(prefix="/api/operations", tags=["Operations"])

@router.post("/allocation-simulator")
def allocation_simulator(payload: AllocationInput):
    key = "forecast_24h" if payload.hours <= 24 else "forecast_72h"
    df = read_csv(key).copy()
    df["predicted_demand"] = pd.to_numeric(df["predicted_demand"], errors="coerce").fillna(0)
    demand = (df.groupby(["zone_id", "zone_name"], as_index=False)["predicted_demand"].sum()
                .sort_values("predicted_demand", ascending=False).head(payload.top_zones))
    total = float(demand["predicted_demand"].sum()) or 1.0
    demand["recommended_taxis"] = (demand["predicted_demand"] / total * payload.available_taxis).round().astype(int)
    # Ensure the recommendation uses exactly the available fleet.
    diff = payload.available_taxis - int(demand["recommended_taxis"].sum())
    if len(demand) and diff:
        demand.iloc[0, demand.columns.get_loc("recommended_taxis")] += diff
    demand["demand_share_pct"] = (demand["predicted_demand"] / total * 100).round(2)
    peak = demand.iloc[0]
    return {
        "hours": payload.hours,
        "available_taxis": payload.available_taxis,
        "total_predicted_demand": round(total, 1),
        "priority_zone": str(peak["zone_name"]),
        "allocation": demand[["zone_id","zone_name","predicted_demand","demand_share_pct","recommended_taxis"]].to_dict(orient="records"),
        "decision": f"Prioritize {peak['zone_name']} with {int(peak['recommended_taxis'])} taxis based on forecast demand share."
    }
