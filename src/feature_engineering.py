"""
Feature engineering utilities for Urban Flow Analytics.

Team: Noesis
SLIIT Codefest Datathon 2026
"""

import numpy as np
import pandas as pd


def add_basic_time_features(
    df: pd.DataFrame,
    timestamp_column: str = "pickup_timestamp"
) -> pd.DataFrame:
    """
    Add calendar-based features derived from pickup time.
    """

    df = df.copy()

    timestamp = pd.to_datetime(
        df[timestamp_column],
        errors="coerce"
    )

    df["pickup_hour"] = timestamp.dt.hour
    df["pickup_day_of_week"] = timestamp.dt.dayofweek
    df["pickup_day_of_month"] = timestamp.dt.day
    df["pickup_month"] = timestamp.dt.month
    df["is_weekend"] = (
        timestamp.dt.dayofweek >= 5
    )

    return df


def add_cyclical_time_features(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    Encode hour-of-day and day-of-week as cyclical features.

    This preserves the circular relationship between:
    23:00 -> 00:00
    Sunday -> Monday
    """

    df = df.copy()

    # Hour follows a 24-hour cycle.
    df["hour_sin"] = np.sin(
        2 * np.pi * df["pickup_hour"] / 24
    )

    df["hour_cos"] = np.cos(
        2 * np.pi * df["pickup_hour"] / 24
    )

    # Day of week follows a 7-day cycle.
    df["dow_sin"] = np.sin(
        2 * np.pi * df["pickup_day_of_week"] / 7
    )

    df["dow_cos"] = np.cos(
        2 * np.pi * df["pickup_day_of_week"] / 7
    )

    return df


def add_route_features(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    Add route-level features used by the ETA model.
    """

    df = df.copy()

    # Whether pickup and drop-off occurred in the same taxi zone.
    df["same_zone_trip"] = (
        df["origin_loc_id"] == df["dest_loc_id"]
    ).astype(int)

    # Compact route identifier.
    df["route_id"] = (
        df["origin_loc_id"].astype(str)
        + "_"
        + df["dest_loc_id"].astype(str)
    )

    # Numeric encoding for tree-based models.
    df["route_id_code"] = (
        df["route_id"].astype("category").cat.codes
    )

    # Log transformation reduces the influence of very large
    # distance values.
    df["log_distance_miles"] = np.log1p(
        df["distance_miles"].clip(lower=0)
    )

    return df


def prepare_eta_features(
    df: pd.DataFrame
) -> pd.DataFrame:
    """
    Prepare the enhanced ETA feature set used in the project.
    """

    df = add_basic_time_features(df)
    df = add_cyclical_time_features(df)
    df = add_route_features(df)

    return df


def add_demand_features(
    df: pd.DataFrame,
    group_column: str | None = None
) -> pd.DataFrame:
    """
    Add lag and rolling features for demand forecasting.

    The dataframe must already be sorted chronologically.
    """

    df = df.copy()

    if group_column is None:

        df["lag1"] = df["trip_count"].shift(1)
        df["lag2"] = df["trip_count"].shift(2)
        df["lag3"] = df["trip_count"].shift(3)

        df["lag24"] = df["trip_count"].shift(24)
        df["lag168"] = df["trip_count"].shift(168)

        df["rolling24"] = (
            df["trip_count"]
            .shift(1)
            .rolling(24)
            .mean()
        )

        df["rolling168"] = (
            df["trip_count"]
            .shift(1)
            .rolling(168)
            .mean()
        )

    else:

        # Grouped version for zone-level demand forecasting.
        grouped = df.groupby(group_column)["trip_count"]

        df["lag1"] = grouped.shift(1)
        df["lag24"] = grouped.shift(24)
        df["lag168"] = grouped.shift(168)

        df["rolling24"] = (
            grouped
            .shift(1)
            .rolling(24)
            .mean()
            .reset_index(level=0, drop=True)
        )

        df["rolling168"] = (
            grouped
            .shift(1)
            .rolling(168)
            .mean()
            .reset_index(level=0, drop=True)
        )

    return df