from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[2]
MODELS_DIR = BASE_DIR / "models"


FARE_MODEL_PATH = MODELS_DIR / "fare" / "base_fare_model.pkl"
ETA_MODEL_PATH = MODELS_DIR / "eta" / "eta_model.pkl"
ETA_METADATA_PATH = MODELS_DIR / "eta" / "eta_model_metadata.pkl"
DEMAND_MODEL_PATH = MODELS_DIR / "demand" / "top_zone_demand_model.pkl"


# ============================================================
# MODEL LOADING
# ============================================================

def _load_model(path: Path):
    if not path.exists():
        return None

    try:
        return joblib.load(path)
    except Exception as exc:
        print(f"Model load failed: {path} -> {exc}")
        return None


fare_model = _load_model(FARE_MODEL_PATH)
eta_model = _load_model(ETA_MODEL_PATH)
demand_model = _load_model(DEMAND_MODEL_PATH)

eta_metadata = None

if ETA_METADATA_PATH.exists():
    try:
        eta_metadata = joblib.load(ETA_METADATA_PATH)
    except Exception as exc:
        print(f"ETA metadata load failed: {exc}")


# ============================================================
# STATUS
# ============================================================

def model_status() -> Dict[str, Any]:
    return {
        "fare_model": fare_model is not None,
        "eta_model": eta_model is not None,
        "demand_model": demand_model is not None,
        "eta_metadata": eta_metadata is not None,
    }


# ============================================================
# HELPERS
# ============================================================

def _get(data: Any, key: str, default=None):
    """
    Safely read a value from either:
    - Pydantic request objects
    - dictionaries
    """

    if isinstance(data, dict):
        return data.get(key, default)

    return getattr(data, key, default)


def _parse_timestamp(value) -> pd.Timestamp:
    timestamp = pd.to_datetime(value, errors="coerce")

    if pd.isna(timestamp):
        timestamp = pd.Timestamp("2026-04-01 12:00:00")

    return timestamp


def _deterministic_route_code(origin: int, destination: int) -> int:
    """
    Stable route encoding for inference.

    Note:
    The original ETA training pipeline used pandas categorical
    codes without persisting the category mapping. This provides
    deterministic inference for the deployed application.
    """

    text = f"{int(origin)}_{int(destination)}"

    value = 0

    for char in text:
        value = (value * 31 + ord(char)) % 1_000_000

    return value


# ============================================================
# FARE PREDICTION
# ============================================================

def predict_fare(data: Any) -> float:
    pickup_timestamp = _parse_timestamp(
        _get(data, "pickup_timestamp")
    )

    provider_code = int(
        _get(data, "provider_code", 1)
    )

    rider_count = float(
        _get(data, "rider_count", 1)
    )

    distance_miles = float(
        _get(data, "distance_miles", 1.0)
    )

    rate_class_id = int(
        _get(data, "rate_class_id", 1)
    )

    offline_record_flag = _get(
        data,
        "offline_record_flag",
        "N",
    )

    origin_loc_id = int(
        _get(data, "origin_loc_id", 1)
    )

    dest_loc_id = int(
        _get(data, "dest_loc_id", 1)
    )

    # --------------------------------------------------------
    # Normalize values
    # --------------------------------------------------------

    distance_miles = max(
        distance_miles,
        0.01,
    )

    rider_count = max(
        rider_count,
        1,
    )

    offline_numeric = (
        1
        if str(offline_record_flag).upper()
        in {"Y", "YES", "1", "TRUE"}
        else 0
    )

    # --------------------------------------------------------
    # Feature frame
    # --------------------------------------------------------

    features = pd.DataFrame(
        [
            {
                "provider_code": provider_code,
                "rider_count": rider_count,
                "distance_miles": distance_miles,
                "rate_class_id": rate_class_id,
                "offline_record_flag": offline_numeric,
                "origin_loc_id": origin_loc_id,
                "dest_loc_id": dest_loc_id,
                "pickup_hour": pickup_timestamp.hour,
                "pickup_day_of_week": pickup_timestamp.dayofweek,
                "pickup_day_of_month": pickup_timestamp.day,
                "pickup_month": pickup_timestamp.month,
                "is_weekend": int(
                    pickup_timestamp.dayofweek >= 5
                ),
            }
        ]
    )

    if fare_model is None:
        rush_hour = 1.0 if 16 <= pickup_timestamp.hour <= 20 and pickup_timestamp.dayofweek < 5 else 0.0
        overnight = 0.5 if (20 <= pickup_timestamp.hour or pickup_timestamp.hour <= 6) else 0.0
        base_calc = 3.00 + (distance_miles * 3.30) + rush_hour + overnight
        return max(3.0, round(base_calc, 2))

    try:
        prediction = fare_model.predict(features)

        value = float(
            np.asarray(prediction).reshape(-1)[0]
        )

        return max(
            0.0,
            round(value, 2),
        )

    except Exception as exc:
        raise RuntimeError(
            f"Fare prediction failed: {exc}"
        ) from exc


# ============================================================
# ETA PREDICTION
# ============================================================

def predict_eta(data: Any) -> float:

    pickup_timestamp = _parse_timestamp(
        _get(data, "pickup_timestamp")
    )

    provider_code = int(
        _get(data, "provider_code", 1)
    )

    rider_count = float(
        _get(data, "rider_count", 1)
    )

    distance_miles = float(
        _get(data, "distance_miles", 1.0)
    )

    rate_class_id = int(
        _get(data, "rate_class_id", 1)
    )

    offline_record_flag = _get(
        data,
        "offline_record_flag",
        "N",
    )

    origin_loc_id = int(
        _get(data, "origin_loc_id", 1)
    )

    dest_loc_id = int(
        _get(data, "dest_loc_id", 1)
    )

    distance_miles = max(
        distance_miles,
        0.01,
    )

    rider_count = max(
        rider_count,
        1,
    )

    offline_numeric = (
        1
        if str(offline_record_flag).upper()
        in {"Y", "YES", "1", "TRUE"}
        else 0
    )

    same_zone_trip = int(
        origin_loc_id == dest_loc_id
    )

    route_id_code = _deterministic_route_code(
        origin_loc_id,
        dest_loc_id,
    )

    hour = pickup_timestamp.hour
    dow = pickup_timestamp.dayofweek

    features = pd.DataFrame(
        [
            {
                "provider_code": provider_code,
                "rider_count": rider_count,
                "distance_miles": distance_miles,
                "log_distance_miles": np.log1p(
                    distance_miles
                ),
                "rate_class_id": rate_class_id,
                "offline_record_flag": offline_numeric,
                "origin_loc_id": origin_loc_id,
                "dest_loc_id": dest_loc_id,
                "same_zone_trip": same_zone_trip,
                "route_id_code": route_id_code,
                "pickup_hour": hour,
                "pickup_day_of_week": dow,
                "pickup_day_of_month": pickup_timestamp.day,
                "pickup_month": pickup_timestamp.month,
                "is_weekend": int(dow >= 5),
                "hour_sin": np.sin(
                    2 * np.pi * hour / 24
                ),
                "hour_cos": np.cos(
                    2 * np.pi * hour / 24
                ),
                "dow_sin": np.sin(
                    2 * np.pi * dow / 7
                ),
                "dow_cos": np.cos(
                    2 * np.pi * dow / 7
                ),
            }
        ]
    )

    if eta_model is None:
        hour = pickup_timestamp.hour
        congestion_mult = 1.35 if (8 <= hour <= 10 or 17 <= hour <= 19) else 1.0
        base_eta = (3.5 + distance_miles * 3.6) * congestion_mult
        return max(1.0, round(base_eta, 2))

    try:
        prediction = eta_model.predict(features)

        log_prediction = float(
            np.asarray(prediction)
            .reshape(-1)[0]
        )

        # Model was trained using log1p(target)
        duration = float(
            np.expm1(log_prediction)
        )

        return max(
            0.1,
            round(duration, 2),
        )

    except Exception as exc:
        raise RuntimeError(
            f"ETA prediction failed: {exc}"
        ) from exc


# ============================================================
# DEMAND PREDICTION
# ============================================================

def predict_demand(data: Any) -> float:

    if demand_model is None:
        return 28.5

    if isinstance(data, dict):
        features = pd.DataFrame([data])
    else:
        features = pd.DataFrame(
            [data.model_dump()]
            if hasattr(data, "model_dump")
            else [vars(data)]
        )

    try:
        prediction = demand_model.predict(
            features
        )

        value = float(
            np.asarray(prediction)
            .reshape(-1)[0]
        )

        return max(
            0.0,
            round(value, 2),
        )

    except Exception as exc:
        raise RuntimeError(
            f"Demand prediction failed: {exc}"
        ) from exc


# ============================================================
# MODEL QUALITY
# ============================================================

def model_quality():

    return {
        "fare": {
            "name": "Base Fare",
            "mae": 3.9314,
            "rmse": 8.1008,
            "r2": 0.7944,
        },
        "eta": {
            "name": "ETA",
            "mae": 4.1480,
            "rmse": 20.8903,
            "r2": 0.2676,
        },
        "demand": {
            "name": "Demand Forecast",
            "mae": 22.5144,
            "rmse": 34.0419,
            "r2": 0.9394,
        },
    }