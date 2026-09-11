"""
Model evaluation utilities for Urban Flow Analytics.

Team: Noesis
SLIIT Codefest Datathon 2026
"""

import numpy as np
import pandas as pd

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


def regression_metrics(
    y_true,
    y_pred
) -> dict:
    """
    Calculate MAE, RMSE and R² for a regression model.
    """

    mae = mean_absolute_error(
        y_true,
        y_pred
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_true,
            y_pred
        )
    )

    r2 = r2_score(
        y_true,
        y_pred
    )

    return {
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
    }


def regression_metrics_dataframe(
    y_true,
    y_pred
) -> pd.DataFrame:
    """
    Return regression metrics as a one-row dataframe.
    """

    metrics = regression_metrics(
        y_true,
        y_pred
    )

    return pd.DataFrame([metrics])


def compare_models(
    results: list[dict]
) -> pd.DataFrame:
    """
    Convert model evaluation dictionaries into a comparison table.

    Example
    -------
    results = [
        {
            "model": "Baseline",
            "mae": 4.2,
            "rmse": 8.4,
            "r2": 0.78
        },
        ...
    ]
    """

    return (
        pd.DataFrame(results)
        .sort_values("mae")
        .reset_index(drop=True)
    )


def print_regression_metrics(
    y_true,
    y_pred,
    model_name: str = "Model"
) -> dict:
    """
    Calculate and display regression metrics.
    """

    metrics = regression_metrics(
        y_true,
        y_pred
    )

    print(f"\n{model_name}")
    print("-" * len(model_name))
    print(f"MAE :  {metrics['mae']:.4f}")
    print(f"RMSE:  {metrics['rmse']:.4f}")
    print(f"R²  :  {metrics['r2']:.4f}")

    return metrics