"""
Taxi-zone utilities for Urban Flow Analytics.

Team: Noesis
SLIIT Codefest Datathon 2026
"""

import pandas as pd


def prepare_zone_lookup(
    zones: pd.DataFrame
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Create separate lookup tables for pickup and drop-off zones.

    Parameters
    ----------
    zones : pd.DataFrame
        Zone dataset containing:
        loc_id, borough_name, zone_name, service_zone

    Returns
    -------
    pickup_zones, dropoff_zones
        Two lookup tables ready for merging with taxi records.
    """

    pickup_zones = zones.rename(
        columns={
            "loc_id": "origin_loc_id",
            "borough_name": "pickup_borough",
            "zone_name": "pickup_zone",
            "service_zone": "pickup_service_zone",
        }
    ).copy()

    dropoff_zones = zones.rename(
        columns={
            "loc_id": "dest_loc_id",
            "borough_name": "dropoff_borough",
            "zone_name": "dropoff_zone",
            "service_zone": "dropoff_service_zone",
        }
    ).copy()

    return pickup_zones, dropoff_zones


def join_taxi_with_zones(
    taxi_df: pd.DataFrame,
    zones: pd.DataFrame
) -> pd.DataFrame:
    """
    Join taxi records with pickup and drop-off zone information.
    """

    pickup_zones, dropoff_zones = prepare_zone_lookup(zones)

    result = taxi_df.merge(
        pickup_zones,
        on="origin_loc_id",
        how="left"
    )

    result = result.merge(
        dropoff_zones,
        on="dest_loc_id",
        how="left"
    )

    return result


def create_od_flow_table(
    df: pd.DataFrame,
    origin_column: str = "origin_loc_id",
    destination_column: str = "dest_loc_id"
) -> pd.DataFrame:
    """
    Aggregate taxi trips into origin-destination flows.
    """

    od = (
        df.groupby(
            [origin_column, destination_column],
            dropna=False
        )
        .size()
        .reset_index(name="trip_count")
        .sort_values(
            "trip_count",
            ascending=False
        )
        .reset_index(drop=True)
    )

    return od


def create_zone_statistics(
    df: pd.DataFrame,
    zone_column: str,
    count_column_name: str = "trip_count"
) -> pd.DataFrame:
    """
    Calculate trip counts by taxi zone.
    """

    statistics = (
        df.groupby(
            zone_column,
            dropna=False
        )
        .size()
        .reset_index(name=count_column_name)
        .sort_values(
            count_column_name,
            ascending=False
        )
        .reset_index(drop=True)
    )

    return statistics