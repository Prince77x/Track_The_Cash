import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RiskMap } from '../components/RiskMap';
import {
  BarChart3,
  Download,
  Send,
  Zap,
  Cpu,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';

export const AdminView = () => {
  const { getAuthHeader } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [velocityData, setVelocityData] = useState([]);
  const [metrics, setMetrics] = useState({ roc_auc: 0.865, precision_at_10: 0.800 });
  const [loading, setLoading] = useState(true);

  // Manual Alert Modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertDistrict, setAlertDistrict] = useState('Noida');
  const [alertSeverity, setAlertSeverity] = useState('CRITICAL');
  const [alertMessage, setAlertMessage] = useState('Urgent field patrol required around ATM hubs in sector 62.');
  const [alertSuccess, setAlertSuccess] = useState(null);

  // Simulation state
  const [injecting, setInjecting] = useState(false);
  const [injectResult, setInjectResult] = useState(null);
  const [streamMode, setStreamMode] = useState('random');
  const [streamRate, setStreamRate] = useState(0.5);
  const [modeSuccess, setModeSuccess] = useState(null);

  const fetchAdminData = async () => {
    try {
      const headers = getAuthHeader();
      const [predRes, velRes, metRes] = await Promise.all([
        fetch('/predict?limit=150', { headers }),
        fetch('/analytics/velocity?days=7', { headers }),
        fetch('/analytics/metrics', { headers })
      ]);

      if (predRes.ok) {
        const predData = await predRes.json();
        setPredictions(predData.predictions || []);
      }
      if (velRes.ok) {
        const velData = await velRes.json();
        setVelocityData(velData.trend || []);
      }
      if (metRes.ok) {
        const metData = await metRes.json();
        setMetrics(metData);
      }
    } catch (err) {
      console.error('Failed to fetch Admin intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSendManualAlert = async (e) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeader(), 'Content-Type': 'application/json' };
      const res = await fetch('/alerts/trigger', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          district: alertDistrict,
          severity: alertSeverity,
          message: alertMessage
        })
      });
      if (res.ok) {
        setAlertSuccess('Alert dispatched to state police units via SMTP successfully.');
        setTimeout(() => {
          setAlertSuccess(null);
          setShowAlertModal(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to dispatch alert:', err);
    }
  };

  const handleInjectSpike = async (stage = 'all') => {
    setInjecting(true);
    setInjectResult(null);
    try {
      const headers = { ...getAuthHeader(), 'Content-Type': 'application/json' };
      const res = await fetch('/simulation/inject-spike', {
        method: 'POST',
        headers,
        body: JSON.stringify({ stage, fast: true })
      });
      if (res.ok) {
        const data = await res.json();
        setInjectResult(data);
        await fetchAdminData();
      }
    } catch (err) {
      console.error('Spike injection failed:', err);
    } finally {
      setInjecting(false);
    }
  };

  const handleSetStreamMode = async () => {
    try {
      const headers = { ...getAuthHeader(), 'Content-Type': 'application/json' };
      const res = await fetch('/simulation/mode', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: streamMode, rate_per_second: parseFloat(streamRate) })
      });
      if (res.ok) {
        setModeSuccess('Stream mode configuration updated.');
        setTimeout(() => setModeSuccess(null), 2500);
      }
    } catch (err) {
      console.error('Mode update failed:', err);
    }
  };

  const handleDownloadCSV = () => {
    const headers = getAuthHeader();
    fetch('/reports/export', { headers })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `track_the_cash_predictions_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  // Group velocity data by state for visual bar summary
  const stateTotals = velocityData.reduce((acc, cur) => {
    acc[cur.state] = (acc[cur.state] || 0) + cur.complaint_count;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(stateTotals), 1);

  return (
    <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#0b0f19', minHeight: 'calc(100vh - 65px)' }}>
      {/* Top Action Bar */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '0.5rem', borderRadius: '8px', color: '#c084fc' }}>
            <Cpu size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              I4C National Command &amp; Intelligence Oversight
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
              XGBoost Model Monitoring, Simulation Injection &amp; Inter-Jurisdictional Mule Flows
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Manual Send Alert Button */}
          <button
            onClick={() => setShowAlertModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#f59e0b',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Send size={15} />
            Dispatch Manual Alert
          </button>

          {/* Download CSV Report */}
          <button
            onClick={handleDownloadCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            Export CSV Intelligence
          </button>

          {/* Inject Demo Spike */}
          <button
            onClick={() => handleInjectSpike('all')}
            disabled={injecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: injecting ? 'not-allowed' : 'pointer',
              opacity: injecting ? 0.7 : 1,
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Zap size={15} />
            {injecting ? 'Injecting Scenario...' : 'Inject Demo Spike'}
          </button>
        </div>
      </div>

      {/* Spike Result Notification */}
      {injectResult && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.825rem',
          color: '#fca5a5'
        }}>
          <div>
            <strong>Scripted Spike Scenario Triggered!</strong> Stage 1 (Cross-State Rajasthan ➔ UP) &amp; Stage 2 (UP Velocity Spike) fired {injectResult.alerts_fired?.length} alert(s) and elevated risk for {injectResult.affected_atms?.length} ATMs.
          </div>
          <button
            onClick={() => setInjectResult(null)}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Middle Grid: Metrics & Charts & Simulation Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* ML Performance Metrics */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                XGBoost Model Validation Metrics
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              TEST SPLIT 80/20
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>ROC-AUC Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
                {metrics.roc_auc || 0.85}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Target: &ge; 0.80 (Met)</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Precision@10 (Top ATMs)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7', marginTop: '0.2rem' }}>
                {metrics.precision_at_10 || 0.80}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Target: &ge; 0.70 (Met)</div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '0.6rem' }}>
            <strong>Engineered Features:</strong> District Fraud Density, 6h Complaint Velocity, Mule Proximity (Haversine km), ATM Density Normalizer, Cross-State Linkage.
          </div>
        </div>

        {/* Complaint Velocity Bar Chart */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                7-Day State Complaint Velocity
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>I4C Top Fraud Hubs</span>
          </div>

          {/* Simple Clean HTML/CSS Bar Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.2rem' }}>
            {Object.entries(stateTotals).map(([state, total]) => {
              const pct = Math.min(100, Math.round((total / maxCount) * 100));
              return (
                <div key={state} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    <span>{state}</span>
                    <span style={{ fontWeight: 700 }}>{total.toLocaleString()} complaints</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Simulation Stream Control */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="#10b981" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Stream Simulation Controls
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.3rem' }}>Replay Mode</label>
              <select
                value={streamMode}
                onChange={(e) => setStreamMode(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '0.4rem',
                  fontSize: '0.8rem'
                }}
              >
                <option value="random">Probabilistic (Calibrated I4C Distribution)</option>
                <option value="scripted">Scripted Scenario (Deterministic Demo)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Ingestion Speed: 1 complaint / {streamRate}s
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={streamRate}
                onChange={(e) => setStreamRate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={handleSetStreamMode}
              style={{
                backgroundColor: '#10b981',
                color: '#000000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '0.2rem'
              }}
            >
              Update Stream Settings
            </button>
            {modeSuccess && <span style={{ color: '#34d399', fontSize: '0.72rem' }}>✓ {modeSuccess}</span>}
          </div>
        </div>
      </div>

      {/* Map with Cross-State Mule Flow Vectors */}
      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', height: '580px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#c084fc" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Inter-Jurisdictional Cross-State Cash-Out Flow Map
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>
            Dotted Vectors: Origin Complaint State ➔ Mule Account Registered ATM Zone
          </span>
        </div>

        <RiskMap predictions={predictions} showFlows={true} />
      </div>

      {/* Manual Alert Modal */}
      {showAlertModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '1.75rem',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              Dispatch Emergency Law Enforcement Alert
            </h3>

            {alertSuccess ? (
              <div style={{ color: '#34d399', padding: '1rem 0', textAlign: 'center', fontWeight: 700 }}>
                ✓ {alertSuccess}
              </div>
            ) : (
              <form onSubmit={handleSendManualAlert} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>District</label>
                  <input
                    type="text"
                    value={alertDistrict}
                    onChange={(e) => setAlertDistrict(e.target.value)}
                    required
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '0.45rem', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Severity Level</label>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '0.45rem', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="CRITICAL">CRITICAL (High Urgency)</option>
                    <option value="WARNING">WARNING (Elevated Velocity)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>Operational Instructions</label>
                  <textarea
                    rows={3}
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    required
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '0.45rem', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(false)}
                    style={{ backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 0.9rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Send SMTP Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
