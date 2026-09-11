import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

type ModelMetric = {
  task: string;
  model: string;
  validation_mae: number;
  validation_rmse: number;
  validation_r2: number;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
};

type ModelsResponse =
  | ModelMetric[]
  | {
      value: ModelMetric[];
      Count?: number;
    };

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: unknown, digits = 3) => {
  return num(value).toFixed(digits);
};

const formatR2 = (value: unknown) => {
  return `${(num(value) * 100).toFixed(1)}%`;
};

export default function Models() {
  const [models, setModels] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadModels = async () => {
      try {
        setLoading(true);
        setError("");

        // Backend endpoint is /api/models
        const response = await api.get<ModelsResponse>("/models");

        if (!active) return;

        const data = response.data;

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data?.value)
            ? data.value
            : [];

        if (records.length === 0) {
          throw new Error("No model performance records returned.");
        }

        // Normalize numeric values so .toFixed() never crashes
        const normalized: ModelMetric[] = records.map((model) => ({
          task: String(model.task ?? "Unknown Task"),
          model: String(model.model ?? "Unknown Model"),

          validation_mae: num(model.validation_mae),
          validation_rmse: num(model.validation_rmse),
          validation_r2: num(model.validation_r2),

          test_mae: num(model.test_mae),
          test_rmse: num(model.test_rmse),
          test_r2: num(model.test_r2),
        }));

        setModels(normalized);
      } catch (err) {
        if (!active) return;

        console.error("Model performance error:", err);

        setError("Unable to load model performance data.");
        setModels([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      active = false;
    };
  }, []);

  const bestModel = useMemo(() => {
    if (models.length === 0) {
      return null;
    }

    return [...models].sort(
      (a, b) => num(b.test_r2) - num(a.test_r2)
    )[0];
  }, [models]);

  const averageR2 = useMemo(() => {
    if (models.length === 0) {
      return 0;
    }

    return (
      models.reduce(
        (sum, model) => sum + num(model.test_r2),
        0
      ) / models.length
    );
  }, [models]);

  const getTaskDescription = (task: string) => {
    const value = task.toLowerCase();

    if (value.includes("fare")) {
      return "Predicts expected base fare before trip completion.";
    }

    if (
      value.includes("eta") ||
      value.includes("time") ||
      value.includes("duration")
    ) {
      return "Estimates expected trip duration in minutes.";
    }

    if (value.includes("demand")) {
      return "Forecasts future mobility demand across priority zones.";
    }

    return "Predictive model powering UrbanFlow AI.";
  };

  return (
    <div className="page uf-models-page">

      <style>{`
        /* =========================================================
           URBANFLOW AI — MODELS PAGE VISIBILITY
           Scoped to this page so global CSS cannot wash out text.
           ========================================================= */

        .uf-models-page {
          width: 100%;
          min-width: 0;
          color: #17212b;
        }

        .uf-models-page,
        .uf-models-page * {
          text-rendering: optimizeLegibility;
        }

        .uf-models-page .page-header h1,
        .uf-models-page .panel-header h2,
        .uf-models-page .model-card h2,
        .uf-models-page .kpi-card strong,
        .uf-models-page .model-name strong,
        .uf-models-page .model-row > strong,
        .uf-models-page .metric-grid strong,
        .uf-models-page .algorithm-box strong,
        .uf-models-page .insight-box strong {
          color: #17212b !important;
          opacity: 1 !important;
        }

        .uf-models-page .page-header h1 {
          font-size: 32px !important;
          line-height: 1.15 !important;
          font-weight: 800 !important;
        }

        .uf-models-page .page-header p,
        .uf-models-page .panel-header p,
        .uf-models-page .model-description,
        .uf-models-page .insight-box p,
        .uf-models-page .algorithm-box p {
          color: #40515e !important;
          opacity: 1 !important;
          font-size: 15px !important;
          line-height: 1.65 !important;
        }

        .uf-models-page .eyebrow {
          color: #d71935 !important;
          opacity: 1 !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          letter-spacing: 1.8px !important;
        }

        .uf-models-page .status-pill,
        .uf-models-page .model-score {
          color: #d71935 !important;
          background: #fff5f6 !important;
          border-color: #efcbd1 !important;
          opacity: 1 !important;
          font-weight: 800 !important;
        }

        /* KPI cards */
        .uf-models-page .kpi-card span {
          color: #526472 !important;
          opacity: 1 !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          letter-spacing: 1px !important;
        }

        .uf-models-page .kpi-card strong {
          font-size: 30px !important;
        }

        .uf-models-page .kpi-card small {
          color: #5d6d79 !important;
          opacity: 1 !important;
          font-size: 13px !important;
        }

        /* Strongest predictive signal */
        .uf-models-page .insight-box {
          color: #17212b !important;
          background: #fff7f8 !important;
          border-color: #f0cdd2 !important;
        }

        .uf-models-page .insight-box strong {
          display: block !important;
          font-size: 17px !important;
          line-height: 1.5 !important;
        }

        /* Performance matrix */
        .uf-models-page .model-table {
          overflow-x: auto !important;
        }

        .uf-models-page .model-table-head {
          color: #40515e !important;
          background: #f4f7f9 !important;
        }

        .uf-models-page .model-table-head span {
          color: #40515e !important;
          opacity: 1 !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          letter-spacing: 1px !important;
        }

        .uf-models-page .model-row {
          color: #253746 !important;
          min-width: 900px !important;
        }

        .uf-models-page .model-row > span {
          color: #405b6c !important;
          opacity: 1 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
        }

        .uf-models-page .model-name strong {
          font-size: 15px !important;
          font-weight: 800 !important;
        }

        .uf-models-page .model-name small {
          color: #647581 !important;
          opacity: 1 !important;
          font-size: 12px !important;
        }

        .uf-models-page .model-row > strong {
          font-size: 15px !important;
          font-weight: 800 !important;
        }

        .uf-models-page .model-r2 {
          color: #d71935 !important;
        }

        /* Model detail cards */
        .uf-models-page .model-card h2 {
          font-size: 20px !important;
          line-height: 1.35 !important;
        }

        .uf-models-page .model-description {
          font-size: 15px !important;
          margin-top: 16px !important;
        }

        .uf-models-page .metric-grid span {
          color: #586a77 !important;
          opacity: 1 !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: .8px !important;
        }

        .uf-models-page .metric-grid strong {
          font-size: 18px !important;
          font-weight: 800 !important;
        }

        /* Algorithm / metric explanation boxes */
        .uf-models-page .algorithm-box {
          color: #17212b !important;
          background: #f7f8fa !important;
          border-color: #d9e0e5 !important;
        }

        .uf-models-page .algorithm-box span {
          color: #d71935 !important;
          opacity: 1 !important;
          font-size: 12px !important;
          font-weight: 900 !important;
          letter-spacing: 1.2px !important;
        }

        .uf-models-page .algorithm-box strong {
          color: #17212b !important;
          opacity: 1 !important;
          font-size: 16px !important;
          line-height: 1.45 !important;
          font-weight: 800 !important;
        }

        .uf-models-page .algorithm-box p {
          color: #40515e !important;
          opacity: 1 !important;
          font-size: 14px !important;
        }

        /* Loading / error */
        .uf-models-page .empty-state {
          color: #40515e !important;
          font-size: 15px !important;
          opacity: 1 !important;
        }

        @media (max-width: 900px) {
          .uf-models-page .page-header h1 {
            font-size: 28px !important;
          }

          .uf-models-page .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .uf-models-page .kpi-grid {
            grid-template-columns: 1fr;
          }

          .uf-models-page .page-header h1 {
            font-size: 25px !important;
          }
        }
`}</style>

      {/* HEADER */}

      <div className="page-header">
        <div>
          <div className="eyebrow">
            MODEL OBSERVATORY
          </div>

          <h1>ML Model Performance</h1>

          <p>
            Transparent evaluation of the machine-learning
            models powering UrbanFlow AI predictions,
            forecasting and operational intelligence.
          </p>
        </div>

        <div className="status-pill">
          <span className="status-dot" />
          MODELS OPERATIONAL
        </div>
      </div>

      {/* LOADING */}

      {loading && (
        <section className="panel">
          <div className="empty-state">
            Loading model performance...
          </div>
        </section>
      )}

      {/* ERROR */}

      {error && (
        <section className="panel">
          <div className="empty-state">
            {error}
          </div>
        </section>
      )}

      {/* CONTENT */}

      {!loading && !error && models.length > 0 && (
        <>
          {/* KPI CARDS */}

          <div className="kpi-grid">

            <div className="kpi-card">
              <span>MODELS EVALUATED</span>

              <strong>
                {models.length}
              </strong>

              <small>
                Production-ready ML artifacts
              </small>
            </div>

            <div className="kpi-card">
              <span>BEST TEST R²</span>

              <strong>
                {bestModel
                  ? formatR2(bestModel.test_r2)
                  : "—"}
              </strong>

              <small>
                {bestModel
                  ? bestModel.task
                  : "No model available"}
              </small>
            </div>

            <div className="kpi-card">
              <span>AVERAGE TEST R²</span>

              <strong>
                {formatR2(averageR2)}
              </strong>

              <small>
                Across evaluated models
              </small>
            </div>

            <div className="kpi-card">
              <span>MODEL STATUS</span>

              <strong>
                READY
              </strong>

              <small>
                API inference available
              </small>
            </div>

          </div>

          {/* BEST MODEL */}

          {bestModel && (
            <section className="panel">

              <div className="panel-header">
                <div>
                  <div className="eyebrow">
                    STRONGEST PREDICTIVE SIGNAL
                  </div>

                  <h2>
                    {bestModel.task}
                  </h2>
                </div>

                <span className="model-score">
                  R² {formatR2(bestModel.test_r2)}
                </span>
              </div>

              <div className="insight-box">

                <strong>
                  {bestModel.task} currently delivers
                  the strongest test-set predictive
                  performance.
                </strong>

                <p>
                  The {bestModel.model} model achieved a
                  test R² of{" "}
                  {formatR2(bestModel.test_r2)}
                  {" "}with a test MAE of{" "}
                  {formatNumber(bestModel.test_mae, 2)}.
                  This makes it the strongest evaluated
                  predictive component in the current
                  UrbanFlow AI system.
                </p>

              </div>

            </section>
          )}

          {/* PERFORMANCE MATRIX */}

          <section className="panel">

            <div className="panel-header">

              <div>
                <div className="eyebrow">
                  PREDICTIVE SYSTEM
                </div>

                <h2>
                  Performance Matrix
                </h2>

                <p>
                  Held-out validation and test-set
                  evaluation of all deployed models.
                </p>
              </div>

              <span className="status-pill">
                VALIDATION + TEST
              </span>

            </div>

            <div className="model-table">

              <div className="model-table-head">
                <span>MODEL</span>
                <span>ALGORITHM</span>
                <span>TEST MAE</span>
                <span>TEST RMSE</span>
                <span>TEST R²</span>
              </div>

              {models.map((model) => (
                <div
                  className="model-row"
                  key={model.task}
                >

                  <div className="model-name">
                    <strong>
                      {model.task}
                    </strong>

                    <small>
                      Active evaluation
                    </small>
                  </div>

                  <span>
                    {model.model}
                  </span>

                  <strong>
                    {formatNumber(model.test_mae)}
                  </strong>

                  <strong>
                    {formatNumber(model.test_rmse)}
                  </strong>

                  <strong className="model-r2">
                    {formatR2(model.test_r2)}
                  </strong>

                </div>
              ))}

            </div>

          </section>

          {/* MODEL DETAILS */}

          <div className="model-detail-grid">

            {models.map((model) => (
              <section
                className="panel model-card"
                key={`${model.task}-detail`}
              >

                <div className="panel-header">

                  <div>
                    <div className="eyebrow">
                      {model.task}
                    </div>

                    <h2>
                      {model.model}
                    </h2>
                  </div>

                  <span className="model-score">
                    R² {formatR2(model.test_r2)}
                  </span>

                </div>

                <p className="model-description">
                  {getTaskDescription(model.task)}
                </p>

                <div className="metric-grid">

                  <div>
                    <span>
                      VALIDATION MAE
                    </span>

                    <strong>
                      {formatNumber(model.validation_mae)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      VALIDATION RMSE
                    </span>

                    <strong>
                      {formatNumber(model.validation_rmse)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      VALIDATION R²
                    </span>

                    <strong>
                      {formatR2(model.validation_r2)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      TEST MAE
                    </span>

                    <strong>
                      {formatNumber(model.test_mae)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      TEST RMSE
                    </span>

                    <strong>
                      {formatNumber(model.test_rmse)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      TEST R²
                    </span>

                    <strong>
                      {formatR2(model.test_r2)}
                    </strong>
                  </div>

                </div>

                <div className="algorithm-box">

                  <span>
                    ALGORITHM
                  </span>

                  <strong>
                    {model.model}
                  </strong>

                </div>

              </section>
            ))}

          </div>

          {/* METRIC EXPLANATION */}

          <section className="panel">

            <div className="panel-header">

              <div>
                <div className="eyebrow">
                  MODEL INTERPRETATION
                </div>

                <h2>
                  Understanding the Metrics
                </h2>
              </div>

            </div>

            <div className="model-detail-grid">

              <div className="algorithm-box">
                <span>MAE</span>

                <strong>
                  Mean Absolute Error
                </strong>

                <p>
                  Average magnitude of prediction
                  error. Lower values indicate more
                  accurate predictions.
                </p>
              </div>

              <div className="algorithm-box">
                <span>RMSE</span>

                <strong>
                  Root Mean Squared Error
                </strong>

                <p>
                  Penalizes larger prediction errors
                  more strongly than MAE.
                </p>
              </div>

              <div className="algorithm-box">
                <span>R²</span>

                <strong>
                  Explained Variance
                </strong>

                <p>
                  Indicates how much variation in the
                  target is explained by the model.
                  Higher values are generally better.
                </p>
              </div>

            </div>

          </section>

        </>
      )}
    </div>
  );
}