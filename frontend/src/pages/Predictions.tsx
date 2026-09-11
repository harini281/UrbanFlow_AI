import { FormEvent, useState } from 'react';
import { api } from '../services/api';
import {
  BrainCircuit,
  Car,
  Clock3,
  MapPin,
  Navigation,
  Sparkles,
} from 'lucide-react';

interface PredictionForm {
  pickup_timestamp: string;
  origin_loc_id: number;
  dest_loc_id: number;
  distance_miles: number;
  rider_count: number;
  provider_code: number;
  rate_class_id: number;
  offline_record_flag: string;
}

interface FareResponse {
  prediction_type: string;
  predicted_base_fare: number;
  currency: string;
}

interface EtaResponse {
  prediction_type: string;
  predicted_duration_minutes: number;
  unit: string;
}

export default function Predictions() {
  const [form, setForm] = useState<PredictionForm>({
    pickup_timestamp: '2026-04-01T12:00',
    origin_loc_id: 132,
    dest_loc_id: 230,
    distance_miles: 3.5,
    rider_count: 1,
    provider_code: 1,
    rate_class_id: 1,
    offline_record_flag: 'N',
  });

  const [fare, setFare] = useState<FareResponse | null>(null);
  const [eta, setEta] = useState<EtaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (
      field: keyof PredictionForm,
      value: string | number,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const runPrediction = async (event: FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setFare(null);
    setEta(null);

    try {
      const payload = {
        pickup_timestamp: form.pickup_timestamp,
        origin_loc_id: Number(form.origin_loc_id),
        dest_loc_id: Number(form.dest_loc_id),
        distance_miles: Number(form.distance_miles),
        rider_count: Number(form.rider_count),
        provider_code: Number(form.provider_code),
        rate_class_id: Number(form.rate_class_id),
        offline_record_flag: form.offline_record_flag,
      };

      const [fareResponse, etaResponse] = await Promise.all([
        api.post<FareResponse>('/predict/fare', payload),
        api.post<EtaResponse>('/predict/eta', payload),
      ]);

      setFare(fareResponse.data);
      setEta(etaResponse.data);
    } catch (err) {
      console.error(err);
      setError(
          'Prediction failed. Please verify the trip inputs and ensure the API is running.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <div className="eyebrow">
              <BrainCircuit size={15} />
              AI PREDICTION ENGINE
            </div>

            <h1>Trip Intelligence</h1>

            <p>
              Predict expected base fare and trip duration using the trained
              Urban Flow Analytics models.
            </p>
          </div>

          <div className="page-header-badge">
            <Sparkles size={16} />
            ML POWERED
          </div>
        </div>

        <div className="prediction-layout">
          <section className="panel prediction-form-panel">
            <div className="panel-heading">
              <div>
                <h2>Trip Parameters</h2>
                <p>Enter the conditions available before the trip starts.</p>
              </div>

              <Navigation size={20} />
            </div>

            <form onSubmit={runPrediction}>
              <div className="prediction-grid">
                <label className="prediction-field">
                  <span>Pickup Time</span>
                  <input
                      type="datetime-local"
                      value={form.pickup_timestamp}
                      onChange={(e) =>
                          updateField('pickup_timestamp', e.target.value)
                      }
                      required
                  />
                </label>

                <label className="prediction-field">
                  <span>Distance — miles</span>
                  <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.distance_miles}
                      onChange={(e) =>
                          updateField('distance_miles', Number(e.target.value))
                      }
                      required
                  />
                </label>

                <label className="prediction-field">
                  <span>Origin Zone ID</span>
                  <input
                      type="number"
                      min="1"
                      value={form.origin_loc_id}
                      onChange={(e) =>
                          updateField('origin_loc_id', Number(e.target.value))
                      }
                      required
                  />
                </label>

                <label className="prediction-field">
                  <span>Destination Zone ID</span>
                  <input
                      type="number"
                      min="1"
                      value={form.dest_loc_id}
                      onChange={(e) =>
                          updateField('dest_loc_id', Number(e.target.value))
                      }
                      required
                  />
                </label>

                <label className="prediction-field">
                  <span>Rider Count</span>
                  <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.rider_count}
                      onChange={(e) =>
                          updateField('rider_count', Number(e.target.value))
                      }
                  />
                </label>

                <label className="prediction-field">
                  <span>Provider Code</span>
                  <input
                      type="number"
                      value={form.provider_code}
                      onChange={(e) =>
                          updateField('provider_code', Number(e.target.value))
                      }
                  />
                </label>

                <label className="prediction-field">
                  <span>Rate Class ID</span>
                  <input
                      type="number"
                      value={form.rate_class_id}
                      onChange={(e) =>
                          updateField('rate_class_id', Number(e.target.value))
                      }
                  />
                </label>

                <label className="prediction-field">
                  <span>Offline Record</span>
                  <select
                      value={form.offline_record_flag}
                      onChange={(e) =>
                          updateField('offline_record_flag', e.target.value)
                      }
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </label>
              </div>

              <button
                  type="submit"
                  className="prediction-submit"
                  disabled={loading}
              >
                {loading ? (
                    <>
                      <span className="prediction-spinner" />
                      Running Models...
                    </>
                ) : (
                    <>
                      <BrainCircuit size={18} />
                      Generate Prediction
                    </>
                )}
              </button>
            </form>

            {error && (
                <div className="prediction-error">
                  {error}
                </div>
            )}
          </section>

          <section className="prediction-results">
            <div className="prediction-results-header">
              <div>
                <div className="eyebrow">MODEL OUTPUT</div>
                <h2>AI Trip Estimate</h2>
              </div>

              <div className="prediction-status">
                <span />
                READY
              </div>
            </div>

            <div className="prediction-result-grid">
              <div className="prediction-result-card">
                <div className="prediction-result-icon">
                  <Car size={22} />
                </div>

                <div className="prediction-result-label">
                  EXPECTED BASE FARE
                </div>

                <div className="prediction-result-value">
                  {fare ? `$${fare.predicted_base_fare.toFixed(2)}` : '—'}
                </div>

                <div className="prediction-result-meta">
                  Tuned HistGradientBoosting
                </div>
              </div>

              <div className="prediction-result-card">
                <div className="prediction-result-icon">
                  <Clock3 size={22} />
                </div>

                <div className="prediction-result-label">
                  ESTIMATED DURATION
                </div>

                <div className="prediction-result-value">
                  {eta
                      ? `${eta.predicted_duration_minutes.toFixed(2)} min`
                      : '—'}
                </div>

                <div className="prediction-result-meta">
                  Enhanced Log-Target Model
                </div>
              </div>
            </div>

            <div className="prediction-trip-summary">
              <div className="prediction-summary-title">
                <MapPin size={17} />
                Trip Context
              </div>

              <div className="prediction-summary-grid">
                <div>
                  <span>Origin</span>
                  <strong>Zone {form.origin_loc_id}</strong>
                </div>

                <div>
                  <span>Destination</span>
                  <strong>Zone {form.dest_loc_id}</strong>
                </div>

                <div>
                  <span>Distance</span>
                  <strong>{form.distance_miles} mi</strong>
                </div>

                <div>
                  <span>Riders</span>
                  <strong>{form.rider_count}</strong>
                </div>
              </div>
            </div>

            {fare && eta && (
                <div className="prediction-insight">
                  <Sparkles size={18} />

                  <div>
                    <strong>AI prediction generated successfully</strong>
                    <p>
                      For this trip configuration, the models estimate a base
                      fare of ${fare.predicted_base_fare.toFixed(2)} and a trip
                      duration of {eta.predicted_duration_minutes.toFixed(2)}{' '}
                      minutes.
                    </p>
                  </div>
                </div>
            )}
          </section>
        </div>
      </div>
  );
}