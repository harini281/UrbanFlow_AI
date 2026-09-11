import { useState } from "react";
import { api } from "../api";

type AllocationRow = {
  zone_name?: string;
  zone?: string;
  origin_zone?: string;
  recommended_taxis?: number;
  recommended_vehicles?: number;
  vehicles?: number;
  allocation?: number;
  demand?: number;
};

type AllocationResponse = {
  available_taxis?: number;
  available_fleet?: number;
  total_fleet?: number;
  recommendations?: AllocationRow[];
  allocation?: AllocationRow[];
  message?: string;
};

export default function Operations() {
  const [fleet, setFleet] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AllocationResponse | null>(null);
  const [error, setError] = useState("");

  const runAllocation = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post<AllocationResponse>(
        "/operations/allocation-simulator",
        {
          available_taxis: fleet,
        }
      );

      setResult(response.data);
    } catch (err: any) {
      console.error("Fleet allocation error:", err);

      const detail = err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item: any) => item?.msg || "Invalid request")
            .join(", ")
        );
      } else {
        setError(
          detail ||
            err?.response?.data?.message ||
            "Unable to generate fleet allocation."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const rows =
    result?.recommendations ||
    result?.allocation ||
    [];

  const getZoneName = (row: AllocationRow) =>
    row.zone_name ||
    row.zone ||
    row.origin_zone ||
    "Priority Zone";

  const getVehicles = (row: AllocationRow) =>
    row.recommended_taxis ??
    row.recommended_vehicles ??
    row.vehicles ??
    row.allocation ??
    0;

  const totalAllocated = rows.reduce(
    (sum, row) => sum + getVehicles(row),
    0
  );

  const fleetReturned =
    result?.available_taxis ??
    result?.available_fleet ??
    result?.total_fleet ??
    fleet;

  return (
    <div className="operations-page">
      <div className="page-hero">
        <div>
          <div className="page-eyebrow">
            OPERATIONS CENTER
          </div>

          <h1>Smart Fleet Allocation</h1>

          <p>
            Convert predicted demand into an AI-recommended
            taxi deployment strategy across priority zones.
          </p>
        </div>

        <div className="status-badge">
          <span />
          AI OPTIMIZATION READY
        </div>
      </div>

      <div className="operations-control-card">
        <div>
          <div className="control-label">
            AVAILABLE FLEET
          </div>

          <div className="control-description">
            Number of vehicles available for deployment
          </div>
        </div>

        <div className="fleet-input-group">
          <input
            type="number"
            min={1}
            max={10000}
            value={fleet}
            onChange={(e) => {
              const value = Number(e.target.value);

              if (Number.isFinite(value)) {
                setFleet(Math.max(1, value));
              }
            }}
          />

          <span>vehicles</span>

          <button
            onClick={runAllocation}
            disabled={loading || fleet < 1}
          >
            {loading
              ? "OPTIMIZING..."
              : "OPTIMIZE ALLOCATION"}
          </button>
        </div>
      </div>

      {error && (
        <div className="operations-error">
          <strong>Allocation failed:</strong>{" "}
          {error}
        </div>
      )}

      {result && (
        <>
          <div className="operations-kpis">
            <div className="operation-kpi">
              <span>AVAILABLE FLEET</span>

              <strong>
                {fleetReturned}
              </strong>
            </div>

            <div className="operation-kpi">
              <span>PRIORITY ZONES</span>

              <strong>
                {rows.length}
              </strong>
            </div>

            <div className="operation-kpi">
              <span>VEHICLES ALLOCATED</span>

              <strong>
                {totalAllocated}
              </strong>
            </div>

            <div className="operation-kpi">
              <span>REMAINING</span>

              <strong>
                {Math.max(
                  0,
                  fleetReturned - totalAllocated
                )}
              </strong>
            </div>
          </div>

          <div className="allocation-card">
            <div className="allocation-header">
              <div>
                <div className="page-eyebrow">
                  AI RECOMMENDED DEPLOYMENT
                </div>

                <h2>
                  Fleet Distribution by Zone
                </h2>
              </div>

              <div className="allocation-total">
                {fleetReturned} VEHICLES
              </div>
            </div>

            {rows.length > 0 ? (
              <div className="allocation-list">
                {rows.map((row, index) => {
                  const vehicles =
                    getVehicles(row);

                  const percentage =
                    fleetReturned > 0
                      ? Math.min(
                          100,
                          (vehicles /
                            fleetReturned) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      className="allocation-row"
                      key={`${getZoneName(row)}-${index}`}
                    >
                      <div className="allocation-rank">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="allocation-zone">
                        <div className="zone-name">
                          {getZoneName(row)}
                        </div>

                        <div className="allocation-bar">
                          <div
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="allocation-value">
                        <strong>
                          {vehicles}
                        </strong>

                        <span>
                          vehicles
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="operations-empty">
                <div className="empty-icon">
                  ✦
                </div>

                <h2>
                  No Allocation Returned
                </h2>

                <p>
                  The optimizer completed but did
                  not return zone recommendations.
                </p>
              </div>
            )}
          </div>

          <div className="operations-insight">
            <div className="insight-icon">
              ✦
            </div>

            <div>
              <div className="page-eyebrow">
                AI OPERATIONAL INSIGHT
              </div>

              <p>
                Fleet capacity is prioritized toward
                zones with stronger predicted demand,
                helping operators align vehicle supply
                with expected mobility demand.
              </p>
            </div>
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="operations-empty">
          <div className="empty-icon">
            ✦
          </div>

          <h2>
            Ready for Optimization
          </h2>

          <p>
            Enter the available fleet size and run
            the AI optimizer to generate a zone-level
            deployment recommendation.
          </p>
        </div>
      )}
    </div>
  );
}