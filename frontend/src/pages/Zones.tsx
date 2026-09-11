import { useEffect, useMemo, useState } from "react";
import {
  MapPinned,
  ArrowUpRight,
  Search,
  RefreshCw,
} from "lucide-react";

import { api } from "../services/api";

interface Zone {
  loc_id: number;
  zone_name: string;
  borough_name: string;
  outgoing_trips: number;
  incoming_trips: number;
  total_activity: number;
}

interface Hotspot {
  origin_loc_id: number;
  origin_zone: string;
  outgoing_trip_count: number;
}

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadZones = async () => {
    try {
      setLoading(true);
      setError("");

      const [zoneResponse, hotspotResponse] =
        await Promise.all([
          api.get<Zone[]>("/zones", {
            params: { limit: 265 },
          }),
          api.get<Hotspot[]>("/zones/hotspots", {
            params: { limit: 15 },
          }),
        ]);

      setZones(zoneResponse.data);
      setHotspots(hotspotResponse.data);
    } catch (err: any) {
      console.error("Zone intelligence error:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load real zone intelligence."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  /*
   * ==========================================================
   * SEARCH ACROSS ALL 265 REAL ZONES
   * ==========================================================
   */

  const filteredZones = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return zones;
    }

    return zones.filter((zone) => {
      return (
        zone.zone_name
          ?.toLowerCase()
          .includes(query) ||
        zone.borough_name
          ?.toLowerCase()
          .includes(query) ||
        String(zone.loc_id).includes(query)
      );
    });
  }, [zones, search]);

  /*
   * ==========================================================
   * REAL DATA KPIs
   * ==========================================================
   */

  const totalOutgoing = zones.reduce(
    (sum, zone) =>
      sum + Number(zone.outgoing_trips || 0),
    0
  );

  const totalIncoming = zones.reduce(
    (sum, zone) =>
      sum + Number(zone.incoming_trips || 0),
    0
  );

  const highestZone = zones[0];

  const hotspotTotal = hotspots.reduce(
    (sum, zone) =>
      sum + Number(zone.outgoing_trip_count || 0),
    0
  );

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="analytics-page">

      {/* ====================================================
          HEADER
          ==================================================== */}

      <div className="page-heading">

        <div>
          <div className="page-eyebrow">
            <MapPinned size={14} />
            ZONE INTELLIGENCE
          </div>

          <h1>Urban Zone Intelligence</h1>

          <p>
            Explore the actual 265-zone taxi network using
            real pickup, drop-off and total mobility activity
            derived from the processed dataset.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadZones}
          disabled={loading}
        >
          <RefreshCw
            size={14}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>

      </div>

      {/* ====================================================
          ERROR
          ==================================================== */}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* ====================================================
          KPI GRID
          ==================================================== */}

      <div className="zone-kpi-grid">

        <div className="zone-kpi">
          <span>ANALYZED ZONES</span>

          <strong>
            {zones.length}
          </strong>

          <small>
            Real taxi network zones
          </small>
        </div>

        <div className="zone-kpi">

          <span>TOP ACTIVITY ZONE</span>

          <strong>
            {highestZone?.zone_name ?? "—"}
          </strong>

          <small>
            {highestZone
              ? `${Number(
                  highestZone.total_activity
                ).toLocaleString()} total movements`
              : "Waiting for data"}
          </small>

        </div>

        <div className="zone-kpi">

          <span>OUTBOUND TRIPS</span>

          <strong>
            {totalOutgoing.toLocaleString()}
          </strong>

          <small>
            Across all analyzed zones
          </small>

        </div>

        <div className="zone-kpi">

          <span>INBOUND TRIPS</span>

          <strong>
            {totalIncoming.toLocaleString()}
          </strong>

          <small>
            Across all analyzed zones
          </small>

        </div>

      </div>

      {/* ====================================================
          COMPLETE ZONE TABLE
          ==================================================== */}

      <section className="zone-panel">

        <div className="panel-header">

          <div>

            <h2>
              Complete Zone Network
            </h2>

            <p>
              All available taxi zones ranked by total
              real-world mobility activity.
            </p>

          </div>

          <div className="search-box">

            <Search size={14} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search zone, borough or ID..."
            />

          </div>

        </div>

        {loading ? (

          <div className="loading-state">

            <RefreshCw
              size={20}
              className="spin"
            />

            Loading real zone intelligence...

          </div>

        ) : (

          <div className="zone-table">

            <div className="zone-table-head">

              <span>RANK</span>
              <span>ZONE</span>
              <span>BOROUGH</span>
              <span>OUTBOUND</span>
              <span>INBOUND</span>
              <span>TOTAL ACTIVITY</span>

            </div>

            {filteredZones.map(
              (zone, index) => {

                const total =
                  Number(
                    zone.total_activity || 0
                  );

                return (
                  <div
                    className="zone-row"
                    key={zone.loc_id}
                  >

                    <div className="rank-cell">
                      #
                      {String(
                        index + 1
                      ).padStart(3, "0")}
                    </div>

                    <div className="zone-name">

                      <span>
                        {zone.zone_name}
                      </span>

                      {index === 0 && (
                        <span className="top-badge">
                          TOP ACTIVITY
                        </span>
                      )}

                    </div>

                    <div className="location-id">
                      {zone.borough_name}
                    </div>

                    <div className="trip-count">
                      {Number(
                        zone.outgoing_trips || 0
                      ).toLocaleString()}
                    </div>

                    <div className="trip-count">
                      {Number(
                        zone.incoming_trips || 0
                      ).toLocaleString()}
                    </div>

                    <div className="share-cell">

                      <div className="share-track">

                        <div
                          className="share-fill"
                          style={{
                            width: highestZone
                              ? `${Math.min(
                                  (total /
                                    Number(
                                      highestZone.total_activity ||
                                        1
                                    )) *
                                    100,
                                  100
                                )}%`
                              : "0%",
                          }}
                        />

                      </div>

                      <span>
                        {total.toLocaleString()}
                      </span>

                    </div>

                  </div>
                );
              }
            )}

            {filteredZones.length === 0 && (
              <div className="empty-state">
                No matching zones found.
              </div>
            )}

          </div>

        )}

      </section>

      {/* ====================================================
          TOP HOTSPOTS
          ==================================================== */}

      <section className="zone-panel">

        <div className="panel-header">

          <div>

            <h2>
              Top Pickup Hotspots
            </h2>

            <p>
              Highest outbound activity from the actual
              processed taxi-trip dataset.
            </p>

          </div>

          <span className="status-pill">
            TOP 15
          </span>

        </div>

        <div className="zone-table">

          <div className="zone-table-head">

            <span>RANK</span>
            <span>ZONE</span>
            <span>LOCATION ID</span>
            <span>OUTBOUND TRIPS</span>
            <span>SHARE</span>

          </div>

          {hotspots.map(
            (zone, index) => {

              const share =
                hotspotTotal > 0
                  ? (Number(
                      zone.outgoing_trip_count
                    ) /
                      hotspotTotal) *
                    100
                  : 0;

              return (
                <div
                  className="zone-row"
                  key={zone.origin_loc_id}
                >

                  <div className="rank-cell">
                    #
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="zone-name">

                    <span>
                      {zone.origin_zone}
                    </span>

                    {index === 0 && (
                      <span className="top-badge">
                        TOP HOTSPOT
                      </span>
                    )}

                  </div>

                  <div className="location-id">
                    {zone.origin_loc_id}
                  </div>

                  <div className="trip-count">
                    {Number(
                      zone.outgoing_trip_count
                    ).toLocaleString()}
                  </div>

                  <div className="share-cell">

                    <div className="share-track">

                      <div
                        className="share-fill"
                        style={{
                          width: `${Math.min(
                            share * 5,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    <span>
                      {share.toFixed(1)}%
                    </span>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* ====================================================
          OPERATIONAL INSIGHT
          ==================================================== */}

      {highestZone && (

        <section className="zone-insight">

          <div className="insight-icon">
            <ArrowUpRight size={20} />
          </div>

          <div>

            <div className="insight-label">
              OPERATIONAL INSIGHT
            </div>

            <h3>
              {highestZone.zone_name}
              {" "}
              is the highest-activity zone
            </h3>

            <p>
              This zone records{" "}
              <strong>
                {Number(
                  highestZone.total_activity
                ).toLocaleString()}
              </strong>{" "}
              combined inbound and outbound movements
              in the processed taxi dataset. It should
              therefore receive priority consideration
              for demand monitoring and fleet allocation.
            </p>

          </div>

        </section>

      )}

    </div>
  );
}