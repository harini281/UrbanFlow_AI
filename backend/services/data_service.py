from __future__ import annotations

from pathlib import Path
from functools import lru_cache

import pandas as pd


# ============================================================
# PROJECT PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

PROCESSED = ROOT / "data" / "processed" / "taxi_zone"
OUTPUTS = ROOT / "outputs"


# ============================================================
# REAL DATASET FILES
# ============================================================

PROCESSED_FILES = {
    "origin_zones": "pickup_zone_statistics.csv",
    "destination_zones": "dropoff_zone_statistics.csv",
    "od_flows": "od_flow_statistics.csv",
    "am_pm": "am_pm_hotspots.csv",
}

OUTPUT_FILES = {
    "forecast_24h": "demand_forecast_24h.csv",
    "forecast_72h": "demand_forecast_72h.csv",
    "models": "final_model_results.csv",
    "quality": "data_quality_summary.csv",
}


# ============================================================
# DATA LOADERS
# ============================================================

@lru_cache(maxsize=32)
def read_processed_csv(key: str) -> pd.DataFrame:
    if key not in PROCESSED_FILES:
        raise KeyError(f"Unknown processed dataset: {key}")

    path = PROCESSED / PROCESSED_FILES[key]

    if not path.exists():
        raise FileNotFoundError(
            f"Missing processed dataset: {path}"
        )

    return pd.read_csv(path)


@lru_cache(maxsize=32)
def read_output_csv(key: str) -> pd.DataFrame:
    if key not in OUTPUT_FILES:
        raise KeyError(f"Unknown output dataset: {key}")

    path = OUTPUTS / OUTPUT_FILES[key]

    if not path.exists():
        raise FileNotFoundError(
            f"Missing output artifact: {path}"
        )

    return pd.read_csv(path)


# Backward-compatible loader for existing backend code
def read_csv(key: str) -> pd.DataFrame:

    if key in PROCESSED_FILES:
        return read_processed_csv(key)

    if key in OUTPUT_FILES:
        return read_output_csv(key)

    raise KeyError(f"Unknown dataset key: {key}")


# ============================================================
# COMMON SERIALIZATION
# ============================================================

def _records(
    df: pd.DataFrame,
    limit: int | None = None
):
    out = df.head(limit) if limit else df

    return (
        out
        .where(pd.notna(out), None)
        .to_dict(orient="records")
    )


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

def dashboard_summary() -> dict:

    origins = read_processed_csv("origin_zones").copy()
    destinations = read_processed_csv("destination_zones").copy()
    flows = read_processed_csv("od_flows").copy()

    models = read_output_csv("models").copy()
    quality = read_output_csv("quality").copy()
    forecast = read_output_csv("forecast_72h").copy()

    # Numeric normalization
    origins["pickup_trip_count"] = pd.to_numeric(
        origins["pickup_trip_count"],
        errors="coerce"
    ).fillna(0)

    destinations["dropoff_trip_count"] = pd.to_numeric(
        destinations["dropoff_trip_count"],
        errors="coerce"
    ).fillna(0)

    flows["trip_count"] = pd.to_numeric(
        flows["trip_count"],
        errors="coerce"
    ).fillna(0)

    forecast["predicted_demand"] = pd.to_numeric(
        forecast["predicted_demand"],
        errors="coerce"
    ).fillna(0)

    model_r2 = pd.to_numeric(
        models["test_r2"],
        errors="coerce"
    ).dropna()

    # Sort actual data
    origins = origins.sort_values(
        "pickup_trip_count",
        ascending=False
    )

    destinations = destinations.sort_values(
        "dropoff_trip_count",
        ascending=False
    )

    flows = flows.sort_values(
        "trip_count",
        ascending=False
    )

    # Forecast peak zone
    forecast_by_zone = (
        forecast
        .groupby("zone_name", as_index=False)["predicted_demand"]
        .sum()
        .sort_values(
            "predicted_demand",
            ascending=False
        )
    )

    return {
        # Actual trip totals across the complete processed zone dataset
        "total_outgoing_trips": int(
            origins["pickup_trip_count"].sum()
        ),

        "total_incoming_trips": int(
            destinations["dropoff_trip_count"].sum()
        ),

        # Backward-compatible names
        "total_outgoing_trips_top_zones": int(
            origins["pickup_trip_count"].sum()
        ),

        "total_incoming_trips_top_zones": int(
            destinations["dropoff_trip_count"].sum()
        ),

        # Actual highest-activity zones
        "top_pickup_zone": (
            str(origins.iloc[0]["zone_name"])
            if len(origins)
            else "Unknown"
        ),

        "top_dropoff_zone": (
            str(destinations.iloc[0]["zone_name"])
            if len(destinations)
            else "Unknown"
        ),

        # Actual strongest OD movement
        "top_od_flow": {
            "origin": (
                str(flows.iloc[0]["origin_zone"])
                if len(flows)
                else "Unknown"
            ),
            "destination": (
                str(flows.iloc[0]["destination_zone"])
                if len(flows)
                else "Unknown"
            ),
            "trips": int(
                flows.iloc[0]["trip_count"]
            )
            if len(flows)
            else 0,
        },

        # Actual ML forecast output
        "forecast_72h_total": round(
            float(forecast["predicted_demand"].sum()),
            1
        ),

        "forecast_peak_zone": (
            str(forecast_by_zone.iloc[0]["zone_name"])
            if len(forecast_by_zone)
            else "Unknown"
        ),

        # Actual model evaluation
        "average_model_test_r2": round(
            float(model_r2.mean()),
            4
        )
        if len(model_r2)
        else 0,

        "quality_issues": int(
            len(quality)
        ),

        "models_available": int(
            len(models)
        ),
    }


# ============================================================
# ZONE INTELLIGENCE
# ============================================================

def zones(limit: int = 265):

    pickup = read_processed_csv(
        "origin_zones"
    ).copy()

    dropoff = read_processed_csv(
        "destination_zones"
    ).copy()

    pickup = pickup.rename(
        columns={
            "loc_id": "loc_id",
            "zone_name": "zone_name",
            "borough_name": "borough_name",
            "pickup_trip_count": "outgoing_trips",
        }
    )

    dropoff = dropoff.rename(
        columns={
            "loc_id": "loc_id",
            "zone_name": "dropoff_zone_name",
            "borough_name": "dropoff_borough",
            "dropoff_trip_count": "incoming_trips",
        }
    )

    merged = pickup.merge(
        dropoff[
            [
                "loc_id",
                "dropoff_zone_name",
                "dropoff_borough",
                "incoming_trips",
            ]
        ],
        on="loc_id",
        how="outer",
    )

    merged["zone_name"] = (
        merged["zone_name"]
        .fillna(merged["dropoff_zone_name"])
    )

    merged["borough_name"] = (
        merged["borough_name"]
        .fillna(merged["dropoff_borough"])
    )

    merged["outgoing_trips"] = pd.to_numeric(
        merged["outgoing_trips"],
        errors="coerce"
    ).fillna(0).astype(int)

    merged["incoming_trips"] = pd.to_numeric(
        merged["incoming_trips"],
        errors="coerce"
    ).fillna(0).astype(int)

    merged["total_activity"] = (
        merged["outgoing_trips"]
        + merged["incoming_trips"]
    )

    merged = merged.sort_values(
        "total_activity",
        ascending=False
    )

    return _records(
        merged[
            [
                "loc_id",
                "zone_name",
                "borough_name",
                "outgoing_trips",
                "incoming_trips",
                "total_activity",
            ]
        ],
        min(limit, 265)
    )


# ============================================================
# PICKUP HOTSPOTS
# ============================================================

def hotspots(limit: int = 15):

    df = read_processed_csv(
        "origin_zones"
    ).copy()

    df["pickup_trip_count"] = pd.to_numeric(
        df["pickup_trip_count"],
        errors="coerce"
    ).fillna(0).astype(int)

    df = df.sort_values(
        "pickup_trip_count",
        ascending=False
    )

    # Preserve frontend/API field names
    df = df.rename(
        columns={
            "loc_id": "origin_loc_id",
            "zone_name": "origin_zone",
            "pickup_trip_count": "outgoing_trip_count",
        }
    )

    return _records(
        df,
        min(limit, 265)
    )


# ============================================================
# OD FLOW INTELLIGENCE
# ============================================================

def od_flows(limit: int = 20):

    df = read_processed_csv(
        "od_flows"
    ).copy()

    df["trip_count"] = pd.to_numeric(
        df["trip_count"],
        errors="coerce"
    ).fillna(0).astype(int)

    df = df.sort_values(
        "trip_count",
        ascending=False
    )

    return _records(
        df,
        min(limit, 500)
    )


# ============================================================
# AM / PM INTELLIGENCE
# ============================================================

def am_pm(limit: int = 15):

    df = read_processed_csv(
        "am_pm"
    ).copy()

    df["am_trip_count"] = pd.to_numeric(
        df["am_trip_count"],
        errors="coerce"
    ).fillna(0).astype(int)

    df["pm_trip_count"] = pd.to_numeric(
        df["pm_trip_count"],
        errors="coerce"
    ).fillna(0).astype(int)

    df["total_trip_count"] = (
        df["am_trip_count"]
        + df["pm_trip_count"]
    )

    df = df.sort_values(
        "total_trip_count",
        ascending=False
    )

    return _records(
        df,
        min(limit, 265)
    )


# ============================================================
# DEMAND FORECAST
# ============================================================

def forecast(
    hours: int = 72,
    zone_id: int | None = None
):

    key = (
        "forecast_24h"
        if hours <= 24
        else "forecast_72h"
    )

    df = read_output_csv(
        key
    ).copy()

    df["timestamp"] = pd.to_datetime(
        df["timestamp"],
        errors="coerce"
    )

    df["predicted_demand"] = pd.to_numeric(
        df["predicted_demand"],
        errors="coerce"
    ).fillna(0)

    if zone_id is not None:
        df = df[
            df["zone_id"] == zone_id
        ]

    df = df.sort_values(
        [
            "timestamp",
            "predicted_demand",
        ],
        ascending=[
            True,
            False,
        ],
    )

    return _records(df)


# ============================================================
# MODEL PERFORMANCE
# ============================================================

def model_results():

    df = read_output_csv(
        "models"
    ).copy()

    numeric_columns = [
        "validation_mae",
        "validation_rmse",
        "validation_r2",
        "test_mae",
        "test_rmse",
        "test_r2",
    ]

    for column in numeric_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    return _records(df)


# ============================================================
# DATA QUALITY
# ============================================================

def quality_summary():

    return _records(
        read_output_csv("quality")
    )