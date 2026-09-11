import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  MapPinned,
  Search,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { getFlows } from '../api';

type ODFlow = {
  origin_loc_id: number;
  dest_loc_id: number;
  trip_count: number;
  origin_zone: string;
  destination_zone: string;
};

export default function ODFlows() {
  const [flows, setFlows] = useState<ODFlow[]>([]);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFlows = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getFlows(limit);

      if (!Array.isArray(result)) {
        throw new Error('Unexpected OD flow response format.');
      }

      setFlows(result);
    } catch (err) {
      console.error(err);
      setError('Unable to load origin-destination flow data.');
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, [limit]);

  const filteredFlows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return flows;
    }

    return flows.filter((flow) =>
      [
        flow.origin_zone,
        flow.destination_zone,
        String(flow.origin_loc_id),
        String(flow.dest_loc_id),
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [flows, search]);

  const totalTrips = useMemo(
    () =>
      filteredFlows.reduce(
        (sum, flow) => sum + Number(flow.trip_count || 0),
        0
      ),
    [filteredFlows]
  );

  const uniqueOrigins = useMemo(
    () => new Set(filteredFlows.map((flow) => flow.origin_loc_id)).size,
    [filteredFlows]
  );

  const uniqueDestinations = useMemo(
    () => new Set(filteredFlows.map((flow) => flow.dest_loc_id)).size,
    [filteredFlows]
  );

  const maxTrips = useMemo(
    () =>
      filteredFlows.length
        ? Math.max(...filteredFlows.map((flow) => flow.trip_count))
        : 0,
    [filteredFlows]
  );

  const strongestFlow = filteredFlows[0];

  const strongestFlowShare =
    totalTrips > 0 && strongestFlow
      ? (strongestFlow.trip_count / totalTrips) * 100
      : 0;

  return (
    <div className="page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">OD FLOW INTELLIGENCE</div>

          <h1>Origin–Destination Flows</h1>

          <p>
            Discover the strongest mobility corridors across the taxi
            network and identify where passenger movement is concentrated.
          </p>
        </div>

        <div className="segmented-control">
          {[10, 20, 50].map((value) => (
            <button
              key={value}
              className={limit === value ? 'active' : ''}
              onClick={() => setLimit(value)}
              disabled={loading}
            >
              TOP {value}
            </button>
          ))}

          <button
            className="icon-button"
            onClick={loadFlows}
            disabled={loading}
            title="Refresh OD flow data"
          >
            <RefreshCw
              size={15}
              className={loading ? 'spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <section className="panel">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
          }}
        >
          <Search size={17} />

          <input
            type="text"
            placeholder="Search origin, destination or zone ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'inherit',
              fontSize: '14px',
            }}
          />

          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* LOADING */}
      {loading && (
        <section className="panel">
          <div className="empty-state">
            Loading OD flow intelligence...
          </div>
        </section>
      )}

      {/* ERROR */}
      {!loading && error && (
        <section className="panel">
          <div className="empty-state">
            <strong>{error}</strong>
            <br />
            <small>
              Confirm that FastAPI is running on port 8000 and refresh the
              page.
            </small>
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      {!loading && !error && (
        <>
          {/* KPI GRID */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <span>FLOW CORRIDORS</span>

              <strong>{filteredFlows.length}</strong>

              <small>
                {search
                  ? 'Matching selected search'
                  : `Top ${limit} OD relationships`}
              </small>
            </div>

            <div className="kpi-card">
              <span>OBSERVED TRIPS</span>

              <strong>{totalTrips.toLocaleString()}</strong>

              <small>Trips across selected corridors</small>
            </div>

            <div className="kpi-card">
              <span>ORIGIN ZONES</span>

              <strong>{uniqueOrigins}</strong>

              <small>
                Distinct pickup locations represented
              </small>
            </div>

            <div className="kpi-card">
              <span>DESTINATION ZONES</span>

              <strong>{uniqueDestinations}</strong>

              <small>
                Distinct drop-off locations represented
              </small>
            </div>
          </div>

          {/* STRONGEST CORRIDOR */}
          {strongestFlow && (
            <section className="panel flow-insight">
              <div className="panel-header">
                <div>
                  <div className="eyebrow">DOMINANT CORRIDOR</div>

                  <h2>
                    {strongestFlow.origin_zone}
                    <ArrowRight size={18} />
                    {strongestFlow.destination_zone}
                  </h2>

                  <p>
                    Highest-volume origin-to-destination relationship in
                    the selected flow ranking.
                  </p>
                </div>

                <span className="status-pill">
                  TOP {limit} ANALYSIS
                </span>
              </div>

              <div className="flow-route">
                <div>
                  <span>ORIGIN</span>

                  <strong>{strongestFlow.origin_zone}</strong>

                  <small>ID {strongestFlow.origin_loc_id}</small>
                </div>

                <div className="flow-arrow">
                  <ArrowRight size={24} />
                </div>

                <div>
                  <span>DESTINATION</span>

                  <strong>{strongestFlow.destination_zone}</strong>

                  <small>ID {strongestFlow.dest_loc_id}</small>
                </div>

                <div className="flow-route-count">
                  <strong>
                    {strongestFlow.trip_count.toLocaleString()}
                  </strong>

                  <span>observed trips</span>

                  <small>
                    {strongestFlowShare.toFixed(1)}% of displayed
                    corridor trips
                  </small>
                </div>
              </div>
            </section>
          )}

          {/* NETWORK CORRIDORS */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">NETWORK CORRIDORS</div>

                <h2>Highest-Volume Origin → Destination Pairs</h2>

                <p>
                  Ranked from actual processed taxi mobility records.
                </p>
              </div>

              <span className="status-pill">
                HISTORICAL FLOW ANALYSIS
              </span>
            </div>

            {filteredFlows.length === 0 ? (
              <div className="empty-state">
                No OD corridors match your search.
              </div>
            ) : (
              <div className="flow-table">
                <div className="flow-table-head">
                  <span>RANK</span>
                  <span>ORIGIN</span>
                  <span>DESTINATION</span>
                  <span>TRIPS</span>
                  <span>RELATIVE VOLUME</span>
                </div>

                {filteredFlows.map((flow, index) => {
                  const percentage =
                    maxTrips > 0
                      ? (flow.trip_count / maxTrips) * 100
                      : 0;

                  return (
                    <div
                      className="flow-row"
                      key={`${flow.origin_loc_id}-${flow.dest_loc_id}`}
                    >
                      {/* RANK */}
                      <span className="flow-rank">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* ORIGIN */}
                      <div className="flow-zone">
                        <strong>{flow.origin_zone}</strong>

                        <small>
                          <MapPinned size={11} />
                          ID {flow.origin_loc_id}
                        </small>
                      </div>

                      {/* DESTINATION */}
                      <div className="flow-zone">
                        <strong>{flow.destination_zone}</strong>

                        <small>
                          <MapPinned size={11} />
                          ID {flow.dest_loc_id}
                        </small>
                      </div>

                      {/* TRIPS */}
                      <strong className="flow-count">
                        {flow.trip_count.toLocaleString()}
                      </strong>

                      {/* RELATIVE VOLUME */}
                      <div className="flow-volume">
                        <div className="flow-track">
                          <div
                            className="flow-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <span>{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* OPERATIONAL INTERPRETATION */}
          {strongestFlow && (
            <div className="two-col">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <div className="eyebrow">
                      OPERATIONAL SIGNAL
                    </div>

                    <h2>Mobility concentration</h2>
                  </div>

                  <Activity size={20} />
                </div>

                <div className="focus">
                  <div>
                    <MapPinned />

                    <span>Primary origin</span>

                    <strong>
                      {strongestFlow.origin_zone}
                    </strong>
                  </div>

                  <div>
                    <TrendingUp />

                    <span>Corridor volume</span>

                    <strong>
                      {strongestFlow.trip_count.toLocaleString()}
                    </strong>
                  </div>

                  <div>
                    <ArrowRight />

                    <span>Primary destination</span>

                    <strong>
                      {strongestFlow.destination_zone}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <div className="eyebrow">
                      DECISION SUPPORT
                    </div>

                    <h2>Why this matters</h2>
                  </div>
                </div>

                <p>
                  High-volume OD corridors reveal where passenger
                  movement is concentrated. These relationships can
                  support fleet positioning, driver allocation and
                  operational planning alongside the demand forecast.
                </p>

                <p>
                  The corridor ranking is derived from the project's
                  processed taxi mobility data rather than simulated
                  traffic or synthetic records.
                </p>
              </section>
            </div>
          )}

          {/* DATA PROVENANCE */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">DATA PROVENANCE</div>

                <h2>Actual mobility dataset</h2>

                <p>
                  OD intelligence is served from the project's processed
                  taxi-zone flow statistics generated from the source
                  mobility dataset.
                </p>
              </div>

              <span className="status-pill">
                API CONNECTED
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}