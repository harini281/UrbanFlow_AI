import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Clock3,
  MapPinned,
  RefreshCw,
  BarChart3,
  Target,
  Database,
  ArrowUpRight,
} from "lucide-react";

import { getForecast } from "../api";

type ForecastRecord = {
  timestamp: string;
  zone_id: number;
  predicted_demand: number;
  borough_name?: string;
  zone_name: string;
  service_zone?: string;
};

export default function Demand() {
  const [hours, setHours] = useState<24 | 72>(24);
  const [data, setData] = useState<ForecastRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getForecast(hours);

      if (!Array.isArray(result)) {
        throw new Error("Unexpected forecast response format.");
      }

      setData(result);
    } catch (err) {
      console.error("Demand forecast error:", err);
      setError("Unable to load the real demand forecast.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [hours]);

  /* ============================================================
     ZONE TOTALS
     ============================================================ */

  const zoneTotals = useMemo(() => {
    const totals = new Map<string, number>();

    data.forEach((item) => {
      const demand = Number(item.predicted_demand || 0);

      totals.set(
        item.zone_name,
        (totals.get(item.zone_name) || 0) + demand
      );
    });

    return Array.from(totals.entries())
      .map(([zone_name, total]) => ({
        zone_name,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  /* ============================================================
     HOURLY TOTALS
     ============================================================ */

  const hourlyTotals = useMemo(() => {
    const totals = new Map<string, number>();

    data.forEach((item) => {
      const demand = Number(item.predicted_demand || 0);

      totals.set(
        item.timestamp,
        (totals.get(item.timestamp) || 0) + demand
      );
    });

    return Array.from(totals.entries())
      .map(([timestamp, demand]) => ({
        timestamp,
        demand,
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );
  }, [data]);

  /* ============================================================
     KPIs
     ============================================================ */

  const totalForecast = data.reduce(
    (sum, item) => sum + Number(item.predicted_demand || 0),
    0
  );

  const averageDemand =
    hourlyTotals.length > 0
      ? totalForecast / hourlyTotals.length
      : 0;

  const peakHour =
    hourlyTotals.length > 0
      ? hourlyTotals.reduce((max, item) =>
          item.demand > max.demand ? item : max
        )
      : null;

  const maxDemand =
    hourlyTotals.length > 0
      ? Math.max(...hourlyTotals.map((item) => item.demand))
      : 0;

  const peakZone =
    zoneTotals.length > 0 ? zoneTotals[0] : null;

  const peakZoneShare =
    peakZone && totalForecast > 0
      ? (peakZone.total / totalForecast) * 100
      : 0;

  return (
    <div className="uf-demand-page">

      {/* ========================================================
          PAGE-SPECIFIC STYLE
          Intentionally scoped so the old global CSS cannot break
          the Demand page.
          ======================================================== */}

      <style>{`
        .uf-demand-page {
          --uf-red: #d71935;
          --uf-red-dark: #a91228;
          --uf-red-light: #ef3340;

          --uf-bg: #f1f3f5;
          --uf-card: #ffffff;
          --uf-card-soft: #f7f8fa;

          --uf-text: #182532;
          --uf-text-2: #405260;
          --uf-text-3: #687984;

          --uf-border: #d9e0e5;

          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 34px 38px 60px;
          background: #f1f3f5;
          color: #182532;
        }

        .uf-demand-page *,
        .uf-demand-page *::before,
        .uf-demand-page *::after {
          box-sizing: border-box;
        }

        .uf-demand-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 28px;
          margin-bottom: 26px;
        }

        .uf-demand-eyebrow {
          color: #d71935;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.8px;
          line-height: 1.3;
          margin-bottom: 8px;
        }

        .uf-demand-title {
          margin: 0;
          color: #162735;
          font-size: 38px;
          font-weight: 850;
          letter-spacing: -1px;
          line-height: 1.08;
        }

        .uf-demand-description {
          max-width: 760px;
          margin: 12px 0 0;
          color: #526572;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.6;
        }

        .uf-demand-controls {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px;
          background: #ffffff;
          border: 1px solid #d5dde2;
          border-radius: 12px;
          box-shadow: 0 5px 18px rgba(25, 40, 52, 0.06);
          flex-shrink: 0;
        }

        .uf-demand-controls button {
          min-width: 58px;
          height: 40px;
          padding: 0 14px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: #526572;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: .7px;
          cursor: pointer;
        }

        .uf-demand-controls button:hover {
          background: #f4f5f7;
          color: #182532;
        }

        .uf-demand-controls button.active {
          background: #d71935;
          color: #ffffff;
          box-shadow: 0 5px 14px rgba(215, 25, 53, .22);
        }

        .uf-demand-controls button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .uf-demand-refresh {
          width: 42px !important;
          min-width: 42px !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #d71935 !important;
        }

        .uf-demand-message {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 72px;
          margin-bottom: 20px;
          padding: 18px 22px;
          background: #ffffff;
          border: 1px solid #d9e0e5;
          border-left: 4px solid #d71935;
          border-radius: 12px;
          color: #405260;
        }

        .uf-demand-message strong {
          color: #182532;
          font-size: 14px;
          font-weight: 800;
        }

        .uf-demand-error {
          border-left-color: #b91f31;
        }

        /* ======================================================
           KPI ROW
           ====================================================== */

        .uf-demand-kpis {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .uf-demand-kpi {
          min-width: 0;
          min-height: 148px;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 24px;
          background: #ffffff;
          border: 1px solid #d9e0e5;
          border-radius: 14px;
          box-shadow: 0 7px 24px rgba(25, 40, 52, .055);
          position: relative;
          overflow: hidden;
        }

        .uf-demand-kpi::after {
          content: "";
          position: absolute;
          right: -35px;
          bottom: -45px;
          width: 115px;
          height: 115px;
          border-radius: 50%;
          background: rgba(215, 25, 53, .055);
        }

        .uf-demand-kpi-icon {
          width: 50px;
          height: 50px;
          min-width: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff1f3;
          border: 1px solid #f2cbd1;
          border-radius: 12px;
          color: #d71935;
          position: relative;
          z-index: 1;
        }

        .uf-demand-kpi-icon svg {
          width: 23px;
          height: 23px;
          stroke: #d71935;
        }

        .uf-demand-kpi-content {
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .uf-demand-kpi-content span {
          display: block;
          margin: 0 0 7px;
          color: #687984;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.15px;
          line-height: 1.3;
        }

        .uf-demand-kpi-content strong {
          display: block;
          margin: 0;
          color: #162735;
          font-size: 30px;
          font-weight: 850;
          line-height: 1.1;
        }

        .uf-demand-kpi-content small {
          display: block;
          margin-top: 7px;
          color: #687984;
          font-size: 12px;
          font-weight: 550;
          line-height: 1.35;
        }

        /* ======================================================
           PRIORITY ZONE
           ====================================================== */

        .uf-priority-card {
          margin-bottom: 20px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #d9e0e5;
          border-radius: 14px;
          box-shadow: 0 7px 24px rgba(25, 40, 52, .055);
        }

        .uf-priority-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding: 24px 26px;
          border-bottom: 1px solid #e4e8eb;
        }

        .uf-section-label {
          margin-bottom: 7px;
          color: #d71935;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.6px;
          line-height: 1.3;
        }

        .uf-priority-header h2,
        .uf-panel-heading h2,
        .uf-operational-title h2,
        .uf-provenance-heading h2 {
          margin: 0;
          color: #162735;
          font-size: 23px;
          font-weight: 850;
          line-height: 1.25;
          letter-spacing: -.35px;
        }

        .uf-priority-header p,
        .uf-panel-heading p,
        .uf-provenance-heading p {
          margin: 7px 0 0;
          color: #687984;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
        }

        .uf-forecast-badge {
          flex-shrink: 0;
          padding: 8px 12px;
          border: 1px solid #efcbd1;
          border-radius: 7px;
          background: #fff5f6;
          color: #c51d34;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .uf-priority-zone-name {
          color: #162735;
          font-size: 26px;
          font-weight: 850;
        }

        .uf-priority-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          background: #f8fafb;
        }

        .uf-priority-metric {
          min-width: 0;
          min-height: 128px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 27px;
          border-right: 1px solid #dfe5e9;
        }

        .uf-priority-metric:last-child {
          border-right: none;
        }

        .uf-priority-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #fff1f3;
          color: #d71935;
        }

        .uf-priority-icon svg {
          width: 21px;
          height: 21px;
          stroke: #d71935;
        }

        .uf-priority-metric span {
          display: block;
          margin-bottom: 5px;
          color: #687984;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .uf-priority-metric strong {
          display: block;
          color: #182b3a;
          font-size: 22px;
          font-weight: 850;
          line-height: 1.2;
        }

        /* ======================================================
           MAIN CONTENT
           ====================================================== */

        .uf-demand-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(340px, .85fr);
          gap: 20px;
          align-items: stretch;
          margin-bottom: 20px;
        }

        .uf-demand-panel {
          min-width: 0;
          background: #ffffff;
          border: 1px solid #d9e0e5;
          border-radius: 14px;
          box-shadow: 0 7px 24px rgba(25, 40, 52, .055);
          overflow: hidden;
        }

        .uf-panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          padding: 23px 25px;
          border-bottom: 1px solid #e4e8eb;
        }

        /* ======================================================
           FORECAST CHART
           ====================================================== */

        .uf-forecast-chart {
          height: 330px;
          display: flex;
          align-items: flex-end;
          gap: 7px;
          padding: 30px 24px 23px;
          overflow-x: auto;
          background:
            linear-gradient(
              to bottom,
              #ffffff,
              #fbfcfd
            );
        }

        .uf-forecast-column {
          min-width: 22px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
        }

        .uf-forecast-bar {
          width: 100%;
          min-height: 8px;
          border-radius: 5px 5px 2px 2px;
          background: linear-gradient(
            to top,
            #b91f31,
            #ef3340
          );
          box-shadow: 0 4px 10px rgba(215, 25, 53, .13);
        }

        .uf-forecast-column span {
          min-height: 15px;
          color: #647784;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ======================================================
           ZONE RANKING
           ====================================================== */

        .uf-ranking-list {
          padding: 5px 23px 10px;
        }

        .uf-ranking-row {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          min-height: 59px;
          padding: 9px 0;
          border-bottom: 1px solid #e7ebee;
        }

        .uf-ranking-row:last-child {
          border-bottom: none;
        }

        .uf-rank-number {
          color: #d71935;
          font-size: 11px;
          font-weight: 900;
        }

        .uf-rank-main {
          min-width: 0;
        }

        .uf-rank-title {
          margin-bottom: 7px;
          overflow: hidden;
          color: #263c4b;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .uf-rank-bar-track {
          width: 100%;
          height: 6px;
          overflow: hidden;
          border-radius: 10px;
          background: #e7ebee;
        }

        .uf-rank-bar-fill {
          height: 100%;
          border-radius: inherit;
          background: #d71935;
        }

        .uf-rank-value {
          min-width: 72px;
          text-align: right;
        }

        .uf-rank-value strong {
          display: block;
          color: #182b3a;
          font-size: 13px;
          font-weight: 850;
        }

        .uf-rank-value small {
          display: block;
          margin-top: 2px;
          color: #71818c;
          font-size: 10px;
          font-weight: 650;
        }

        /* ======================================================
           OPERATIONAL SIGNAL
           ====================================================== */

        .uf-operational-card,
        .uf-provenance-card {
          margin-bottom: 20px;
          padding: 30px 32px;
          background: #ffffff;
          border: 1px solid #d9e0e5;
          border-radius: 14px;
          box-shadow: 0 7px 24px rgba(25, 40, 52, 0.055);
        }

        .uf-operational-card {
          display: grid;
          grid-template-columns: minmax(240px, 0.7fr) minmax(300px, 1.3fr);
          gap: 28px;
          align-items: center;
        }

        .uf-operational-title h2 {
          margin: 0;
          color: #162735;
          font-size: 28px;
          font-weight: 850;
          line-height: 1.25;
          letter-spacing: -0.4px;
        }

        .uf-operational-description {
          color: #405260;
          font-size: 17px;
          font-weight: 500;
          line-height: 1.7;
        }

        .uf-operational-highlight {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px 24px;
          background: #fff5f6;
          border: 1px solid #efcbd1;
          border-radius: 10px;
        }

        .uf-operational-highlight svg {
          flex-shrink: 0;
          width: 25px;
          height: 25px;
          color: #d71935;
          stroke: #d71935;
        }

        .uf-operational-highlight strong {
          display: block;
          margin-bottom: 6px;
          color: #162735;
          font-size: 19px;
          font-weight: 850;
          line-height: 1.35;
        }

        .uf-operational-highlight span {
          display: block;
          color: #536775;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.6;
        }

        /* ======================================================
           PROVENANCE
           ====================================================== */

        .uf-provenance-card {
          padding: 30px 32px;
        }

        .uf-provenance-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .uf-provenance-heading h2 {
          margin: 0;
          color: #162735;
          font-size: 28px;
          font-weight: 850;
          line-height: 1.25;
          letter-spacing: -0.4px;
        }

        .uf-provenance-heading p {
          margin: 10px 0 0;
          color: #405260;
          font-size: 17px;
          font-weight: 500;
          line-height: 1.6;
        }

        .uf-provenance-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          color: #d71935;
          stroke: #d71935;
        }

        .uf-source-box {
          margin-top: 24px;
          padding: 24px 26px;
          background: #f7f8fa;
          border: 1px solid #d9e0e5;
          border-radius: 10px;
        }

        .uf-source-box span {
          display: block;
          margin-bottom: 8px;
          color: #d71935;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.5px;
          line-height: 1.3;
        }

        .uf-source-box strong {
          display: block;
          color: #263c4b;
          font-size: 19px;
          font-weight: 800;
          line-height: 1.4;
        }

        .uf-source-box p {
          margin: 10px 0 0;
          color: #536775;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.7;
        }

        .uf-spin {
          animation: ufSpin 1s linear infinite;
        }

        @keyframes ufSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1200px) {
          .uf-demand-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .uf-demand-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .uf-demand-page {
            padding: 28px 22px 50px;
          }

          .uf-demand-header {
            flex-direction: column;
          }

          .uf-demand-controls {
            align-self: flex-start;
          }

          .uf-operational-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .uf-demand-page {
            padding: 23px 16px 45px;
          }

          .uf-demand-title {
            font-size: 30px;
          }

          .uf-demand-description {
            font-size: 13px;
          }

          .uf-demand-kpis {
            grid-template-columns: 1fr;
          }

          .uf-priority-header {
            flex-direction: column;
          }

          .uf-priority-metrics {
            grid-template-columns: 1fr;
          }

          .uf-priority-metric {
            border-right: none;
            border-bottom: 1px solid #dfe5e9;
          }

          .uf-priority-metric:last-child {
            border-bottom: none;
          }

          .uf-ranking-list {
            padding-left: 17px;
            padding-right: 17px;
          }

          .uf-panel-heading {
            padding: 20px;
          }

          .uf-operational-card,
          .uf-provenance-card {
            padding: 20px;
          }

          .uf-operational-title h2,
          .uf-provenance-heading h2 {
            font-size: 24px;
          }

          .uf-operational-description,
          .uf-provenance-heading p {
            font-size: 15px;
          }

          .uf-operational-highlight strong {
            font-size: 17px;
          }

          .uf-operational-highlight span,
          .uf-source-box p {
            font-size: 14px;
          }

          .uf-source-box strong {
            font-size: 17px;
          }
        }
      `}</style>

      {/* ========================================================
          HEADER
          ======================================================== */}

      <header className="uf-demand-header">
        <div>
          <div className="uf-demand-eyebrow">
            DEMAND INTELLIGENCE
          </div>

          <h1 className="uf-demand-title">
            Urban Demand Forecast
          </h1>

          <p className="uf-demand-description">
            Machine-learning demand forecasts generated from the
            actual processed taxi mobility dataset.
          </p>
        </div>

        <div className="uf-demand-controls">
          <button
            className={hours === 24 ? "active" : ""}
            onClick={() => setHours(24)}
            disabled={loading}
          >
            24H
          </button>

          <button
            className={hours === 72 ? "active" : ""}
            onClick={() => setHours(72)}
            disabled={loading}
          >
            72H
          </button>

          <button
            className="uf-demand-refresh"
            onClick={loadForecast}
            disabled={loading}
            title="Refresh forecast"
          >
            <RefreshCw
              size={17}
              className={loading ? "uf-spin" : ""}
            />
          </button>
        </div>
      </header>

      {/* ========================================================
          ERROR
          ======================================================== */}

      {error && (
        <section className="uf-demand-message uf-demand-error">
          <RefreshCw size={20} />
          <div>
            <strong>Forecast unavailable</strong>
            <div>{error}</div>
          </div>
        </section>
      )}

      {/* ========================================================
          LOADING
          ======================================================== */}

      {loading && (
        <section className="uf-demand-message">
          <RefreshCw size={20} className="uf-spin" />
          <strong>Loading demand forecast...</strong>
        </section>
      )}

      {!loading && !error && (
        <>
          {/* ====================================================
              KPI CARDS
              ==================================================== */}

          <section className="uf-demand-kpis">

            <div className="uf-demand-kpi">
              <div className="uf-demand-kpi-icon">
                <Clock3 />
              </div>

              <div className="uf-demand-kpi-content">
                <span>FORECAST HORIZON</span>
                <strong>{hours}H</strong>
                <small>ML prediction window</small>
              </div>
            </div>

            <div className="uf-demand-kpi">
              <div className="uf-demand-kpi-icon">
                <BarChart3 />
              </div>

              <div className="uf-demand-kpi-content">
                <span>FORECASTED DEMAND</span>
                <strong>
                  {Math.round(totalForecast).toLocaleString()}
                </strong>
                <small>Predicted trips</small>
              </div>
            </div>

            <div className="uf-demand-kpi">
              <div className="uf-demand-kpi-icon">
                <TrendingUp />
              </div>

              <div className="uf-demand-kpi-content">
                <span>AVERAGE / HOUR</span>
                <strong>
                  {Math.round(averageDemand).toLocaleString()}
                </strong>
                <small>Network demand signal</small>
              </div>
            </div>

            <div className="uf-demand-kpi">
              <div className="uf-demand-kpi-icon">
                <Target />
              </div>

              <div className="uf-demand-kpi-content">
                <span>PEAK DEMAND</span>
                <strong>
                  {Math.round(maxDemand).toLocaleString()}
                </strong>
                <small>
                  {peakHour
                    ? new Date(
                        peakHour.timestamp
                      ).toLocaleString()
                    : "No data"}
                </small>
              </div>
            </div>

          </section>

          {/* ====================================================
              PRIORITY ZONE
              ==================================================== */}

          {peakZone && (
            <section className="uf-priority-card">

              <div className="uf-priority-header">
                <div>
                  <div className="uf-section-label">
                    PRIORITY ZONE
                  </div>

                  <h2 className="uf-priority-zone-name">
                    {peakZone.zone_name}
                  </h2>

                  <p>
                    Highest predicted demand across the selected
                    forecast horizon.
                  </p>
                </div>

                <span className="uf-forecast-badge">
                  ML FORECAST
                </span>
              </div>

              <div className="uf-priority-metrics">

                <div className="uf-priority-metric">
                  <div className="uf-priority-icon">
                    <MapPinned />
                  </div>

                  <div>
                    <span>PREDICTED DEMAND</span>
                    <strong>
                      {Math.round(
                        peakZone.total
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="uf-priority-metric">
                  <div className="uf-priority-icon">
                    <ArrowUpRight />
                  </div>

                  <div>
                    <span>NETWORK SHARE</span>
                    <strong>
                      {peakZoneShare.toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <div className="uf-priority-metric">
                  <div className="uf-priority-icon">
                    <Clock3 />
                  </div>

                  <div>
                    <span>PEAK TIMESTAMP</span>
                    <strong>
                      {peakHour
                        ? new Date(
                            peakHour.timestamp
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </strong>
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ====================================================
              FORECAST + ZONE PRIORITY
              ==================================================== */}

          <section className="uf-demand-main-grid">

            {/* HOURLY FORECAST */}

            <section className="uf-demand-panel">

              <div className="uf-panel-heading">
                <div>
                  <div className="uf-section-label">
                    NETWORK SIGNAL
                  </div>

                  <h2>Hourly Forecast</h2>

                  <p>
                    Aggregated predicted demand across all
                    forecasted zones.
                  </p>
                </div>

                <span className="uf-forecast-badge">
                  {hours}H MODEL
                </span>
              </div>

              {hourlyTotals.length > 0 ? (
                <div className="uf-forecast-chart">

                  {hourlyTotals.map((item, index) => {
                    const height =
                      maxDemand > 0
                        ? Math.max(
                            8,
                            (item.demand / maxDemand) * 100
                          )
                        : 8;

                    const interval = Math.max(
                      1,
                      Math.ceil(hourlyTotals.length / 8)
                    );

                    return (
                      <div
                        className="uf-forecast-column"
                        key={`${item.timestamp}-${index}`}
                        title={`${new Date(
                          item.timestamp
                        ).toLocaleString()} — ${Math.round(
                          item.demand
                        ).toLocaleString()} predicted trips`}
                      >
                        <div
                          className="uf-forecast-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                        {index % interval === 0 ? (
                          <span>
                            {new Date(
                              item.timestamp
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}

                </div>
              ) : (
                <div
                  style={{
                    padding: "40px",
                    color: "#687984",
                  }}
                >
                  No forecast data available.
                </div>
              )}

            </section>

            {/* ZONE PRIORITY */}

            <section className="uf-demand-panel">

              <div className="uf-panel-heading">
                <div>
                  <div className="uf-section-label">
                    ZONE PRIORITY
                  </div>

                  <h2>Highest Forecast Demand</h2>

                  <p>
                    Zones ranked using actual ML predictions.
                  </p>
                </div>
              </div>

              <div className="uf-ranking-list">

                {zoneTotals
                  .slice(0, 10)
                  .map((zone, index) => {

                    const share =
                      totalForecast > 0
                        ? (zone.total / totalForecast) * 100
                        : 0;

                    const relative =
                      peakZone
                        ? (zone.total / peakZone.total) * 100
                        : 0;

                    return (
                      <div
                        className="uf-ranking-row"
                        key={zone.zone_name}
                      >

                        <div className="uf-rank-number">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="uf-rank-main">

                          <div className="uf-rank-title">
                            {zone.zone_name}
                          </div>

                          <div className="uf-rank-bar-track">
                            <div
                              className="uf-rank-bar-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  relative
                                )}%`,
                              }}
                            />
                          </div>

                        </div>

                        <div className="uf-rank-value">
                          <strong>
                            {Math.round(
                              zone.total
                            ).toLocaleString()}
                          </strong>

                          <small>
                            {share.toFixed(1)}%
                          </small>
                        </div>

                      </div>
                    );
                  })}

              </div>

            </section>

          </section>

          {/* ====================================================
              OPERATIONAL SIGNAL
              ==================================================== */}

          <section className="uf-operational-card">

            <div className="uf-operational-title">
              <div className="uf-section-label">
                OPERATIONAL SIGNAL
              </div>

              <h2>
                Demand-driven positioning
              </h2>
            </div>

            <div className="uf-operational-description">
              The forecast identifies where demand is expected
              to concentrate during the selected horizon. These
              predictions can directly feed fleet positioning and
              allocation decisions.
            </div>

            {peakZone && (
              <div className="uf-operational-highlight">
                <MapPinned size={21} />

                <div>
                  <strong>
                    {peakZone.zone_name}
                  </strong>

                  <span>
                    Highest predicted demand with{" "}
                    {Math.round(
                      peakZone.total
                    ).toLocaleString()}{" "}
                    expected trips across the selected
                    forecast horizon.
                  </span>
                </div>
              </div>
            )}

          </section>

          {/* ====================================================
              DATA PROVENANCE
              ==================================================== */}

          <section className="uf-provenance-card">

            <div className="uf-provenance-heading">

              <div>
                <div className="uf-section-label">
                  DATA PROVENANCE
                </div>

                <h2>Real ML Forecast</h2>

                <p>
                  This dashboard does not generate synthetic
                  demand values.
                </p>
              </div>

              <Database className="uf-provenance-icon" />

            </div>

            <div className="uf-source-box">

              <span>SOURCE</span>

              <strong>
                UrbanFlow AI Demand Forecast Pipeline
              </strong>

              <p>
                The selected {hours}-hour forecast is loaded
                from the project's generated machine-learning
                forecast dataset and aggregated by timestamp
                and taxi zone for dashboard visualization.
              </p>

            </div>

          </section>
        </>
      )}

    </div>
  );
}

