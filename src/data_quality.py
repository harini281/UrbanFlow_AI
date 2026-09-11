"""
Data quality utilities for the Urban Flow Analytics project.

Team: Noesis
SLIIT Codefest Datathon 2026

The functions in this module identify and flag the main data-quality
issues required by the challenge without modifying the original records.
"""

import numpy as np
import pandas as pd


def add_quality_flags(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add data-quality flags and derived trip-duration/speed features.

    The original records are preserved. The function only adds columns.

    Parameters
    ----------
    df : pd.DataFrame
        Taxi-trip dataframe containing the raw Urban Flow Analytics columns.

    Returns
    -------
    pd.DataFrame
        Copy of the dataframe with quality flags and temporal features.
    """

    df = df.copy()

    # Convert timestamps only for calculating trip duration.
    pickup_ts = pd.to_datetime(df["pickup_timestamp"], errors="coerce")
    dropoff_ts = pd.to_datetime(df["dropoff_timestamp"], errors="coerce")

    df["trip_duration_seconds"] = (
        dropoff_ts - pickup_ts
    ).dt.total_seconds()

    # ---------------------------------------------------------
    # Core data-quality flags
    # ---------------------------------------------------------

    df["negative_duration_flag"] = (
        df["trip_duration_seconds"] < 0
    )

    df["zero_duration_flag"] = (
        df["trip_duration_seconds"] == 0
    )

    df["zero_distance_flag"] = (
        df["distance_miles"] == 0
    )

    df["zero_rider_count_flag"] = (
        df["rider_count"] == 0
    )

    df["negative_base_fare_flag"] = (
        df["base_fare"] < 0
    )

    df["negative_charge_total_flag"] = (
        df["charge_total"] < 0
    )

    # ---------------------------------------------------------
    # Speed calculation
    # ---------------------------------------------------------

    # Speed is meaningful only when both duration and distance
    # are positive.
    df["speed_mph"] = np.nan

    valid_speed = (
        (df["trip_duration_seconds"] > 0)
        & (df["distance_miles"] > 0)
    )

    df.loc[valid_speed, "speed_mph"] = (
        df.loc[valid_speed, "distance_miles"]
        / (df.loc[valid_speed, "trip_duration_seconds"] / 3600)
    )

    # The project uses 100 mph as the unrealistic-speed threshold.
    df["unrealistic_speed_flag"] = (
        df["speed_mph"] > 100
    )

    # Provider 7 contained zero-duration records and was handled
    # separately for ETA modelling.
    df["provider_7_zero_duration_flag"] = (
        (df["provider_code"] == 7)
        & (df["trip_duration_seconds"] == 0)
    )

    # ---------------------------------------------------------
    # Calendar features
    # ---------------------------------------------------------

    df["pickup_date"] = pickup_ts.dt.date
    df["pickup_hour"] = pickup_ts.dt.hour
    df["pickup_day_of_week"] = pickup_ts.dt.dayofweek
    df["pickup_month"] = pickup_ts.dt.month
    df["is_weekend"] = (
        df["pickup_day_of_week"] >= 5
    )

    return df


def calculate_anomaly_percentage(
    count: int,
    total_rows: int
) -> float:
    """
    Calculate the percentage of total rows affected by an anomaly.
    """

    if total_rows == 0:
        return 0.0

    return (count / total_rows) * 100