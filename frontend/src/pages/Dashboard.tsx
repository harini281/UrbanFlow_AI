import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  CarFront,
  ChevronRight,
  Clock3,
  Database,
  MapPinned,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { getSummary, getForecast, getHotspots, getFlows } from "../api";

type Summary = {
  total_outgoing_trips: number;
  total_incoming_trips: number;
  forecast_72h_total: number;
  average_model_test_r2: number;
  quality_issues: number;
  models_available: number;
  top_pickup_zone: string;
  top_dropoff_zone: string;
  forecast_peak_zone: string;
  top_od_flow: {
    origin: string;
    destination: string;
    trips: number;
  };
};

type ForecastItem = {
  timestamp: string;
  predicted_demand: number;
  zone_name?: string;
};

type Hotspot = {
  origin_zone: string;
  outgoing_trip_count: number;
};

type Flow = {
  origin_zone: string;
  destination_zone: string;
  trip_count: number;
};

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getSummary(),
      getForecast(72),
      getHotspots(10),
      getFlows(10),
    ])
      .then(([summaryData, forecastData, hotspotData, flowData]) => {
        setSummary(summaryData);
        setForecast(Array.isArray(forecastData) ? forecastData : []);
        setHotspots(Array.isArray(hotspotData) ? hotspotData : []);
        setFlows(Array.isArray(flowData) ? flowData : []);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load dashboard data."
        );
      });
  }, []);

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();

    forecast.forEach((item) => {
      const timestamp = String(item.timestamp || "");
      const demand = Number(item.predicted_demand);

      if (!timestamp || !Number.isFinite(demand)) return;

      grouped.set(
        timestamp,
        (grouped.get(timestamp) || 0) + demand
      );
    });

    return Array.from(grouped.entries()).map(
      ([timestamp, demand]) => ({
        time: timestamp.slice(5, 16),
        demand: Math.round(demand),
      })
    );
  }, [forecast]);

  if (error) {
    return (
      <div className="dashboard-state">
        <Activity size={30} />
        <h2>Dashboard connection failed</h2>
        <p>{error}</p>
        <small>
          Make sure the backend API service is running and accessible.
        </small>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="dashboard-state">
        <Activity size={30} className="spin" />
        <h2>Loading UrbanFlow AI</h2>
        <p>Connecting to mobility intelligence services…</p>
      </div>
    );
  }

  const r2Percentage = (
    summary.average_model_test_r2 * 100
  ).toFixed(1);

  return (
    <div className="dashboard-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="dashboard-hero">

        <div className="hero-copy">

          <div className="hero-kicker">
            <span className="live-dot" />
            TEAM NOESIS · SLIIT CODEFEST 2026
          </div>

          <h1>
            Urban mobility.
            <br />
            <span>Made intelligent.</span>
          </h1>

          <p>
            A data-driven mobility intelligence platform for
            understanding demand, movement and operational
            opportunities across the taxi network.
          </p>

          <div className="hero-actions">

            <div className="hero-status">
              <Activity size={16} />
              <div>
                <span>SYSTEM STATUS</span>
                <strong>LIVE DATA CONNECTED</strong>
              </div>
            </div>

            <div className="hero-status">
              <Database size={16} />
              <div>
                <span>DATASET</span>
                <strong>48.6M+ TRIPS</strong>
              </div>
            </div>

          </div>

        </div>


        {/* =================================================
            MOBILITY VISUAL
            ================================================= */}

        <div className="mobility-visual">

          <div className="visual-grid" />

          <div className="road road-one" />
          <div className="road road-two" />
          <div className="road road-three" />

          <div className="route route-one">
            <span />
            <span />
            <span />
          </div>

          <div className="route route-two">
            <span />
            <span />
            <span />
          </div>

          <div className="route route-three">
            <span />
            <span />
            <span />
          </div>

          <div className="visual-node node-one">
            <MapPinned size={15} />
          </div>

          <div className="visual-node node-two">
            <CarFront size={15} />
          </div>

          <div className="visual-node node-three">
            <Zap size={15} />
          </div>

          <div className="visual-label">
            <span>NETWORK INTELLIGENCE</span>
            <strong>REAL MOBILITY SIGNALS</strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          KPI GRID
          ===================================================== */}

      <section className="dashboard-kpis">

        <div className="dashboard-kpi">
          <div className="kpi-icon">
            <CarFront size={20} />
          </div>

          <div className="kpi-content">
            <span>TOTAL OUTBOUND TRIPS</span>
            <strong>
              {summary.total_outgoing_trips.toLocaleString()}
            </strong>
            <small>Historical mobility records</small>
          </div>

          <ArrowUpRight className="kpi-arrow" size={17} />
        </div>


        <div className="dashboard-kpi">
          <div className="kpi-icon">
            <TrendingUp size={20} />
          </div>

          <div className="kpi-content">
            <span>72H PREDICTED DEMAND</span>
            <strong>
              {Math.round(
                summary.forecast_72h_total
              ).toLocaleString()}
            </strong>
            <small>ML forecast signal</small>
          </div>

          <ArrowUpRight className="kpi-arrow" size={17} />
        </div>


        <div className="dashboard-kpi">
          <div className="kpi-icon">
            <BrainCircuit size={20} />
          </div>

          <div className="kpi-content">
            <span>AVERAGE MODEL R²</span>
            <strong>{r2Percentage}%</strong>
            <small>
              {summary.models_available} production models
            </small>
          </div>

          <ArrowUpRight className="kpi-arrow" size={17} />
        </div>


        <div className="dashboard-kpi">
          <div className="kpi-icon">
            <ShieldCheck size={20} />
          </div>

          <div className="kpi-content">
            <span>DATA QUALITY</span>
            <strong>{summary.quality_issues}</strong>
            <small>Quality categories monitored</small>
          </div>

          <ArrowUpRight className="kpi-arrow" size={17} />
        </div>

      </section>


      {/* =====================================================
          MAIN ANALYTICS
          ===================================================== */}

      <section className="dashboard-main-grid">

        {/* DEMAND */}

        <div className="dashboard-card demand-card">

          <div className="card-header">

            <div>
              <span className="card-kicker">
                DEMAND FORECAST
              </span>

              <h2>Next 72 hours</h2>

              <p>
                Machine-learning demand prediction across
                the mobility network.
              </p>
            </div>

            <div className="card-badge">
              <span />
              LIVE MODEL
            </div>

          </div>


          <div className="chart-summary">

            <div>
              <span>FORECAST VOLUME</span>
              <strong>
                {Math.round(
                  summary.forecast_72h_total
                ).toLocaleString()}
              </strong>
            </div>

            <div>
              <span>PEAK ZONE</span>
              <strong>
                {summary.forecast_peak_zone}
              </strong>
            </div>

          </div>


          <div className="dashboard-chart">

            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 15,
                    right: 10,
                    left: -15,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    opacity={0.12}
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fontSize: 10,
                    }}
                    minTickGap={35}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="demand"
                    stroke="#ef3340"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                    }}
                  />

                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                Forecast data unavailable.
              </div>
            )}

          </div>

        </div>


        {/* OPERATIONAL SIGNAL */}

        <div className="dashboard-card signal-card">

          <div className="card-header">

            <div>
              <span className="card-kicker">
                OPERATIONAL SIGNAL
              </span>

              <h2>Where attention is needed</h2>
            </div>

            <Zap size={19} />

          </div>


          <div className="signal-stack">

            <div className="signal-item">

              <div className="signal-number">
                01
              </div>

              <div>
                <span>TOP PICKUP ZONE</span>
                <strong>
                  {summary.top_pickup_zone}
                </strong>
                <small>
                  Highest observed outbound activity
                </small>
              </div>

            </div>


            <div className="signal-item">

              <div className="signal-number">
                02
              </div>

              <div>
                <span>FORECAST PEAK</span>
                <strong>
                  {summary.forecast_peak_zone}
                </strong>
                <small>
                  Highest predicted demand concentration
                </small>
              </div>

            </div>


            <div className="signal-item">

              <div className="signal-number">
                03
              </div>

              <div>
                <span>DOMINANT OD CORRIDOR</span>
                <strong>
                  {summary.top_od_flow.origin}
                </strong>
                <small>
                  → {summary.top_od_flow.destination}
                </small>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SECOND ANALYTICS ROW
          ===================================================== */}

      <section className="dashboard-secondary-grid">

        {/* HOTSPOTS */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <span className="card-kicker">
                SPATIAL INTELLIGENCE
              </span>

              <h2>Pickup hotspots</h2>

              <p>
                Highest-volume pickup zones from actual
                mobility records.
              </p>
            </div>

            <MapPinned size={19} />

          </div>


          <div className="ranking-list">

            {hotspots.map((item, index) => {

              const max =
                hotspots.length > 0
                  ? Math.max(
                      ...hotspots.map(
                        (x) =>
                          Number(
                            x.outgoing_trip_count
                          )
                      )
                    )
                  : 1;

              const width =
                (Number(item.outgoing_trip_count) /
                  max) *
                100;

              return (
                <div
                  className="ranking-row"
                  key={`${item.origin_zone}-${index}`}
                >

                  <span className="rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="ranking-body">

                    <div className="ranking-top">
                      <strong>
                        {item.origin_zone}
                      </strong>

                      <span>
                        {Number(
                          item.outgoing_trip_count
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div className="ranking-track">
                      <div
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </div>


        {/* OD FLOWS */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <span className="card-kicker">
                MOBILITY CORRIDORS
              </span>

              <h2>Major OD flows</h2>

              <p>
                Strongest origin → destination relationships.
              </p>
            </div>

            <ChevronRight size={19} />

          </div>


          <div className="flow-list">

            {flows.map((flow, index) => (
              <div
                className="flow-row"
                key={`${flow.origin_zone}-${flow.destination_zone}-${index}`}
              >

                <span className="flow-rank">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="flow-route">

                  <strong>
                    {flow.origin_zone}
                  </strong>

                  <ChevronRight size={14} />

                  <strong>
                    {flow.destination_zone}
                  </strong>

                </div>

                <span className="flow-value">
                  {Number(
                    flow.trip_count
                  ).toLocaleString()}
                </span>

              </div>
            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          DATA COVERAGE
          ===================================================== */}

      <section className="dashboard-coverage">

        <div className="coverage-main">

          <div className="coverage-icon">
            <Database size={21} />
          </div>

          <div>
            <span>DATASET COVERAGE</span>

            <h2>
              Real-world mobility intelligence
            </h2>

            <p>
              UrbanFlow AI is powered by the processed
              taxi mobility dataset and machine-learning
              outputs generated from the project pipeline.
            </p>
          </div>

        </div>


        <div className="coverage-stats">

          <div>
            <span>OUTBOUND</span>
            <strong>
              {summary.total_outgoing_trips.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>INBOUND</span>
            <strong>
              {summary.total_incoming_trips.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>TOP DROP-OFF</span>
            <strong>
              {summary.top_dropoff_zone}
            </strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="dashboard-footer">

        <div>
          <Clock3 size={14} />
          <span>
            UrbanFlow AI · Predictive mobility intelligence
          </span>
        </div>

        <div>
          <span className="footer-live-dot" />
          API CONNECTED
        </div>

      </footer>

    </div>
  );
}