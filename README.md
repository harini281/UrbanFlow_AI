# Urban Flow Analytics — Team Noesis

## SLIIT Codefest Datathon 2026

**Challenge:** Urban Flow Analytics Data Challenge  
**Team:** Noesis  
**Domain:** Urban Mobility, Machine Learning & Data Analytics

---

## 1. Project Overview

Urban Flow Analytics is a machine-learning and data-analytics solution developed for the SLIIT Codefest Datathon 2026.

The project analyzes large-scale taxi trip data together with taxi-zone information to understand urban mobility patterns and develop predictive models for:

1. **Base Fare Prediction**
2. **ETA / Trip-Time Prediction**
3. **Taxi Demand Forecasting**
4. **Pickup Hotspot Analysis**
5. **Origin-Destination (OD) Flow Analysis**
6. **AM vs PM Mobility Analysis**

The solution combines data-quality assessment, feature engineering, machine learning, spatial analysis, time-series forecasting, model evaluation, and operational insights.

---

# 2. Challenge Objectives

The project addresses the main analytical requirements of the challenge:

- Identify and quantify major data-quality issues.
- Handle anomalous taxi-trip records using justified rules.
- Predict `base_fare`.
- Predict total trip duration in minutes.
- Forecast taxi demand for the next 24–72 hours.
- Identify major taxi pickup hotspots.
- Analyze major origin-destination flows.
- Compare AM and PM demand patterns.
- Evaluate models using MAE, RMSE, and R².
- Perform model comparison and hyperparameter tuning.
- Translate analytical findings into practical transportation insights.

---

# 3. Dataset

The project uses two datasets.

## Taxi Dataset

The taxi dataset contains approximately:

- **48.6 million taxi trips**
- **12 monthly CSV files**
- Coverage: **April 2025 – March 2026**
- **20 attributes per trip**

Important variables include:

- `provider_code`
- `pickup_timestamp`
- `dropoff_timestamp`
- `rider_count`
- `distance_miles`
- `rate_class_id`
- `offline_record_flag`
- `origin_loc_id`
- `dest_loc_id`
- `fare_settlement_method`
- `base_fare`
- `surcharge_misc`
- `transit_tax`
- `driver_tip_payment`
- `toll_total`
- `service_improvement_fee`
- `charge_total`
- `zone_congestion_fee`
- `Airport_fee`
- `congestion_relief_fee`

## Zone Dataset

The zone dataset contains:

- **265 taxi locations**
- Borough information
- Zone names
- Service-zone classifications

The zone data is joined to taxi records using:

- `origin_loc_id`
- `dest_loc_id`

> **Note:** The raw CSV uses `Airport_fee`. The data dictionary refers to this field differently; the original CSV column name was preserved.

---

# 4. Data Availability

The original taxi dataset is approximately **4.9 GB** and contains approximately **48.6 million records**.

Because of the large dataset size, the raw and processed datasets are **not included in this repository/submission package**.

The following directories are intentionally kept empty:

```text
data/
├── raw/
│   ├── taxi/
│   └── zone/
└── processed/
```

For complete reproducibility, the original datasets should be placed into the corresponding directories before executing the data-processing notebooks.

### Expected Data Structure

```text
data/
├── raw/
│   ├── taxi/
│   │   ├── <April_2025_taxi_file>.csv
│   │   ├── ...
│   │   └── <March_2026_taxi_file>.csv
│   └── zone/
│       └── Urban_Flow_Analytics_Zone_Dataset.csv
│
└── processed/
    ├── taxi_clean/
    ├── taxi_zone/
    ├── fare/
    ├── eta/
    └── demand/
```

The project processes the large taxi files using **chunked reading** rather than loading the complete raw dataset into memory at once.

---

# 5. Data Quality Assessment

The project investigated the major anomaly categories specified by the challenge.

| Issue | Records | % of Total | Treatment |
|---|---:|---:|---|
| Negative trip duration | 1,942 | 0.003996% | Excluded from ETA modelling; raw records retained |
| Zero trip duration | 649,668 | 1.336716% | Excluded from ETA modelling; raw records retained |
| Provider 7 zero-duration trips | 642,536 | 1.322042% | Excluded from ETA; retained for fare/spatial analysis |
| Zero distance | 1,478,770 | 3.042625% | Retained and flagged |
| Zero rider count | 231,578 | 0.476480% | Retained and flagged |
| Unrealistic speed >100 mph | 11,899 | 0.024483% | Excluded from ETA modelling; raw records retained |
| Negative base fare | 2,400,031 | 4.938154% | Retained and flagged; excluded from valid fare target modelling |
| Negative charge total | 875,399 | 1.801166% | Retained and flagged |

### Key Observations

- Negative-duration trips were treated as invalid for ETA modelling.
- Provider 7 contained a large concentration of zero-duration records and was handled explicitly.
- Zero-distance trips were not automatically deleted because most still contained valid financial and zone information.
- Zero rider counts were retained rather than globally imputing them to one passenger.
- Extreme-speed records were excluded from ETA modelling because they represent implausible trip-duration/distance combinations.
- Negative financial values were retained in the raw analytical dataset and explicitly flagged.

The project preserves anomalous records whenever they remain useful for non-ETA analyses.

---

# 6. Feature Engineering

Feature engineering was designed separately for each prediction task.

## Fare Prediction

The model uses information available as trip attributes together with pickup-time and location information.

Features include:

- Provider
- Rider count
- Distance
- Rate class
- Offline record flag
- Origin zone
- Destination zone
- Pickup hour
- Day of week
- Day of month
- Month
- Weekend indicator

Post-trip financial variables such as:

- `charge_total`
- `toll_total`
- `driver_tip_payment`

were excluded to avoid target leakage.

### Deployment Consideration

The benchmark fare model includes `distance_miles` because it is available as a dataset trip attribute.

For a strict **pre-trip deployment**, actual travelled distance should be replaced by an estimated route distance derived from origin/destination information.

---

## ETA Prediction

The ETA model excludes:

```text
dropoff_timestamp
```

because it directly determines the target.

The enhanced feature set includes:

- Provider
- Rider count
- Distance
- Log-transformed distance
- Rate class
- Offline record flag
- Origin zone
- Destination zone
- Same-zone indicator
- Route identifier
- Pickup hour
- Day of week
- Day of month
- Month
- Weekend indicator
- Cyclical hour features
- Cyclical day-of-week features

A `log1p` transformation was applied to the trip-duration target to improve model performance.

---

## Demand Forecasting

Demand forecasting uses chronological features and lagged historical demand.

Features include:

- Hour
- Day of week
- Day
- Month
- Weekend indicator
- Lag 1 hour
- Lag 24 hours
- Lag 168 hours
- 24-hour rolling demand
- 168-hour rolling demand

Rolling features are shifted to ensure that the current target is not included in its own predictors.

The demand evaluation uses chronological train/validation/test splits.

---

# 7. Machine Learning Models

The final solution uses **HistGradientBoostingRegressor** models.

This approach provides a strong tree-based regression baseline while remaining practical for the project environment.

---

## Base Fare Prediction

**Final model:**  
`Tuned HistGradientBoostingRegressor`

### Test Performance

| Metric | Result |
|---|---:|
| MAE | **3.9314** |
| RMSE | **8.1008** |
| R² | **0.7944** |

The model explains approximately **79.4% of the variance** in the valid sampled base-fare target.

---

## ETA Prediction

**Final model:**  
`Enhanced Log-Target HistGradientBoostingRegressor`

The target was transformed using:

```text
log1p(target)
```

and predictions were transformed back using:

```text
expm1(prediction)
```

### Test Performance

| Metric | Result |
|---|---:|
| MAE | **4.1480 minutes** |
| RMSE | **20.8903 minutes** |
| R² | **0.2676** |

The model achieves an average absolute prediction error of approximately **4.15 minutes**.

---

## Demand Forecasting

**Final model:**  
`HistGradientBoostingRegressor`

The model forecasts hourly demand for the project's top taxi zones.

### Test Performance

| Metric | Result |
|---|---:|
| MAE | **22.5144 trips/hour** |
| RMSE | **34.0419 trips/hour** |
| R² | **0.9394** |

The high R² indicates strong predictive performance for the hourly demand forecasting task.

---

# 8. Final Model Comparison

| Task | Model | Validation MAE | Validation RMSE | Validation R² | Test MAE | Test RMSE | Test R² |
|---|---|---:|---:|---:|---:|---:|---:|
| Base Fare | Tuned HistGradientBoosting | 4.1746 | 8.3951 | 0.7881 | **3.9314** | **8.1008** | **0.7944** |
| ETA | Enhanced Log-Target HistGradientBoosting | 4.4570 | 18.2718 | 0.3238 | **4.1480** | **20.8903** | **0.2676** |
| Demand | HistGradientBoosting | 23.5468 | 35.3413 | 0.9331 | **22.5144** | **34.0419** | **0.9394** |

---

# 9. Spatial and Mobility Analysis

The taxi-zone analysis identifies major mobility concentrations and travel corridors.

## Major Pickup Hotspots

The highest-volume pickup zones include:

1. Upper East Side South
2. JFK Airport
3. Midtown Center
4. Upper East Side North
5. Penn Station/Madison Sq West
6. Midtown East
7. Times Sq/Theatre District
8. Lincoln Square East
9. Murray Hill
10. Union Sq

The results demonstrate strong concentration of taxi activity within major Manhattan activity centers and airport-related zones.

---

# 10. Major OD Flows

The strongest origin-destination relationships include:

- Upper East Side South → Upper East Side North
- Upper East Side North → Upper East Side South
- Upper East Side South → Upper East Side South
- Upper East Side North → Upper East Side North
- Midtown Center → Upper East Side South
- Upper East Side South → Midtown Center
- Midtown Center → Upper East Side North
- JFK Airport → JFK Airport
- Upper East Side South → Midtown East
- Lincoln Square East → Upper West Side South

Self-zone trips are retained because they represent meaningful local taxi activity rather than automatically treating them as invalid movements.

---

# 11. AM vs PM Analysis

The hotspot analysis shows substantially stronger PM activity across several major zones.

Examples include:

- **Upper East Side South:** approximately 1.98× higher PM volume
- **Upper East Side North:** approximately 1.53× higher PM volume
- **Midtown Center:** approximately 2.55× higher PM volume
- **JFK Airport:** approximately 2.26× higher PM volume
- **LaGuardia Airport:** approximately 2.10× higher PM volume

This indicates that taxi demand is strongly concentrated during the later part of the day across several major activity and transportation zones.

---

# 12. Demand Forecasting

The demand forecasting pipeline produces both:

- **24-hour forecasts**
- **72-hour forecasts**

for the project's top taxi zones.

The highest predicted 72-hour demand totals were observed for:

| Zone | 72-Hour Forecast Total |
|---|---:|
| Midtown Center | 18,662.7 |
| Upper East Side South | 16,958.8 |
| JFK Airport | 15,411.0 |
| Upper East Side North | 14,246.9 |
| Midtown East | 13,458.7 |
| Times Sq/Theatre District | 13,279.6 |
| Penn Station/Madison Sq West | 12,603.5 |
| Murray Hill | 11,191.3 |
| Lincoln Square East | 11,177.8 |
| Union Sq | 10,713.3 |

These forecasts can support short-term taxi allocation and operational planning.

---

# 13. Business Implications

The analysis provides several practical insights for urban mobility operations.

### Dynamic Taxi Allocation

Predicted demand can be used to position vehicles before expected demand peaks.

### Airport Fleet Planning

JFK and LaGuardia demonstrate substantial demand and should receive dedicated demand-aware fleet planning.

### High-Demand Manhattan Zones

Midtown and Upper East Side locations consistently appear among the strongest activity zones and can be prioritized for supply allocation.

### Peak-Period Planning

The strong PM activity suggests that fleet availability should be increased in high-demand areas before evening demand peaks.

### Route-Aware ETA Estimation

Origin-destination relationships and route-level features provide useful information for trip-time prediction.

### Data-Quality Monitoring

Explicit anomaly flags allow downstream systems to identify potentially unreliable records without destroying useful information.

---

# 14. Project Architecture

```text
                    ┌──────────────────────┐
                    │    Raw Taxi Data     │
                    │   ~48.6M trip records │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Data Quality Pipeline │
                    │ Anomaly Detection &   │
                    │ Quality Flags         │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
       ┌──────────────────┐        ┌──────────────────┐
       │ Fare / ETA       │        │ Taxi-Zone        │
       │ Feature Pipeline │        │ Integration      │
       └────────┬─────────┘        └────────┬─────────┘
                │                           │
                ▼                           ▼
       ┌──────────────────┐        ┌──────────────────┐
       │ Fare Model       │        │ Spatial Analysis │
       │ ETA Model        │        │ OD Flows         │
       └────────┬─────────┘        │ Hotspots         │
                │                  │ AM / PM Analysis │
                │                  └────────┬─────────┘
                │                           │
                ▼                           ▼
       ┌──────────────────┐        ┌──────────────────┐
       │ Model Evaluation │        │ Demand Forecast  │
       │ MAE / RMSE / R²  │        │ 24–72 Hours      │
       └────────┬─────────┘        └────────┬─────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
                    ┌──────────────────────┐
                    │ Operational Insights │
                    │ & Decision Support   │
                    └──────────────────────┘
```

---

# 15. Repository Structure

```text
UrbanFlow_AI/
│
├── data/
│   ├── raw/
│   │   ├── taxi/
│   │   └── zone/
│   └── processed/
│
├── models/
│   ├── fare/
│   │   └── base_fare_model.pkl
│   ├── eta/
│   │   ├── eta_model.pkl
│   │   └── eta_model_metadata.pkl
│   └── demand/
│       └── top_zone_demand_model.pkl
│
├── notebooks/
│   ├── taxi/
│   │   ├── 01_taxi_data_audit.ipynb
│   │   ├── 04_fare_model.ipynb
│   │   └── 05_time_model.ipynb
│   │
│   ├── taxi_zone/
│   │   ├── 06_taxi_zone_join.ipynb
│   │   ├── 07_demand_forecasting.ipynb
│   │   ├── 08_hotspot_analysis.ipynb
│   │   └── 09_od_flow_analysis.ipynb
│   │
│   └── Noesis_FinalNotebook.ipynb
│
├── src/
│   ├── __init__.py
│   ├── data_quality.py
│   ├── feature_engineering.py
│   ├── taxi_zone.py
│   └── evaluation.py
│
├── outputs/
│   ├── data_quality_summary.csv
│   ├── final_model_results.csv
│   ├── fare_model_results.csv
│   ├── eta_model_results.csv
│   ├── demand_model_results.csv
│   ├── demand_forecast_24h.csv
│   ├── demand_forecast_72h.csv
│   ├── am_pm_hotspots.csv
│   ├── od_flow_statistics.csv
│   ├── pickup_zone_statistics.csv
│   └── dropoff_zone_statistics.csv
│
├── reports/
│   └── figures/
│       ├── three_task_model_performance.png
│       ├── 72_hour_demand_forecast.png
│       ├── top_15_pickup_hotspots.png
│       ├── top_15_od_flows.png
│       └── am_vs_pm_hotspots.png
│
├── README.md
├── requirements.txt
└── .gitignore
```

---

# 16. Reusable Source Code

The `src/` directory contains reusable Python utilities extracted from the analytical workflow.

## `data_quality.py`

Provides:

- Trip-duration calculation
- Anomaly flags
- Speed calculation
- Unrealistic-speed detection
- Calendar features
- Anomaly-percentage calculation

## `feature_engineering.py`

Provides:

- Calendar features
- Cyclical time features
- Route features
- Same-zone indicators
- Log-distance features
- Demand lag features
- Rolling demand features

## `taxi_zone.py`

Provides:

- Pickup-zone lookup preparation
- Drop-off-zone lookup preparation
- Taxi-zone joins
- OD-flow aggregation
- Zone-level statistics

## `evaluation.py`

Provides:

- MAE calculation
- RMSE calculation
- R² calculation
- Model comparison utilities
- Standardized regression evaluation

The notebooks remain the main analytical record, while `src/` provides reusable project-level functionality.

---

# 17. Main Model Artifacts

The trained models are stored as serialized `.pkl` files.

### Fare

```text
models/fare/base_fare_model.pkl
```

### ETA

```text
models/eta/eta_model.pkl
models/eta/eta_model_metadata.pkl
```

### Demand

```text
models/demand/top_zone_demand_model.pkl
```

The ETA metadata file stores the selected feature configuration, target transformation, and evaluation information required to interpret the trained model.

---

# 18. Reproducibility

The analytical workflow can be reproduced by supplying the original datasets and executing the notebooks in sequence.

### Recommended Workflow

```text
01_taxi_data_audit
        ↓
04_fare_model
        ↓
05_time_model
        ↓
06_taxi_zone_join
        ↓
07_demand_forecasting
        ↓
08_hotspot_analysis
        ↓
09_od_flow_analysis
        ↓
Noesis_FinalNotebook
```

The final notebook consolidates the validated results, model performance, spatial findings, business implications, and system architecture.

Large taxi files should be processed using chunked loading to avoid excessive memory usage.

---

# 19. Requirements

The project was developed using **Python 3.12.7**.

Core dependencies include:

- NumPy
- Pandas
- Scikit-learn
- Matplotlib
- PyArrow
- Joblib
- Jupyter
- IPython Kernel

See `requirements.txt` for the project environment specification.

---

# 20. Limitations

Several limitations should be considered:

1. The ETA model has substantially lower R² than the fare and demand models, indicating that trip duration contains additional variability not fully captured by the available features.

2. The taxi dataset does not provide direct traffic, weather, road-network, or real-time congestion variables.

3. The fare benchmark uses the dataset's `distance_miles` attribute. For strict pre-trip deployment, an estimated route distance should be generated before the trip starts.

4. The demand forecasting model focuses on the top taxi zones rather than every possible zone.

5. The original raw and processed datasets are not included in the submission repository because of their large storage requirements.

6. The analysis is based on the available historical period from April 2025 to March 2026.

---

# 21. Future Improvements

Potential future improvements include:

- Integrating real-time traffic information.
- Incorporating weather conditions.
- Using road-network routing information.
- Developing probabilistic ETA prediction intervals.
- Applying SHAP-based model interpretability.
- Testing LightGBM/XGBoost-based models when available.
- Extending demand forecasting to all taxi zones.
- Developing real-time demand monitoring.
- Deploying the models through an API or dashboard.
- Introducing automated data-quality monitoring.

---

# 22. Final Outcome

The project delivers an integrated urban mobility analytics pipeline covering:

```text
Data Quality
     +
Feature Engineering
     +
Machine Learning
     +
Demand Forecasting
     +
Spatial Analytics
     +
Operational Insights
```

The final system demonstrates how large-scale taxi trip data can be transformed into predictive and decision-support information for urban transportation operations.

---

# 23. Team

## Noesis

**SLIIT Codefest Datathon 2026**

**Urban Flow Analytics Data Challenge**