import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { RiskMap } from '../components/RiskMap';
import { AlertFeed } from '../components/AlertFeed';
import { ComplaintTable } from '../components/ComplaintTable';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { SubmitComplaintModal } from '../components/SubmitComplaintModal';
import {
  Shield, AlertTriangle, RefreshCw, Filter, Search,
  CheckCircle, Building, Radio, Plus, Activity,
  TrendingUp, Layers, X, MapPin
} from 'lucide-react';

// ─── Shared style tokens ───────────────────────────────────────────────────
const C = {
  bg:     '#060913',
  card:   '#0c1322',
  border: '#17233d',
  cyan:   '#38bdf8',
  red:    '#ef4444',
  amber:  '#f59e0b',
  green:  '#10b981',
};

const cardStyle = {
  backgroundColor: C.card, border: `1px solid ${C.border}`,
  borderRadius: '10px', padding: '0.9rem 1rem',
  display: 'flex', alignItems: 'center', gap: '0.85rem'
};

const iconWrap = (color) => ({
  backgroundColor: `${color}18`, padding: '0.6rem',
  borderRadius: '8px', color, flexShrink: 0
});

// ─── Toast Notification ────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{
    position: 'fixed', top: '72px', right: '1.5rem',
    zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem',
    pointerEvents: 'none'
  }}>
    {toasts.map(t => (
      <div key={t.id} className="toast-slide-in" style={{
        backgroundColor: '#0c1322', border: `1px solid ${t.type === 'critical' ? C.red : C.cyan}`,
        borderRadius: '8px', padding: '0.65rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
        minWidth: '280px', maxWidth: '380px'
      }}>
        {t.type === 'critical'
          ? <AlertTriangle size={14} color={C.red} style={{ flexShrink: 0 }} />
          : <Activity size={14} color={C.cyan} style={{ flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: t.type === 'critical' ? '#f87171' : C.cyan, marginBottom: '1px' }}>
            {t.title}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.message}</div>
        </div>
      </div>
    ))}
  </div>
);

// ─── KPI Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, iconColor, label, value, sub, loading }) => (
  <div style={cardStyle}>
    <div style={iconWrap(iconColor)}><Icon size={20} /></div>
    <div>
      <div style={{ fontSize: '0.68rem', color: '#4d6080', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1.1 }}>
        {loading ? <span style={{ color: '#2a3850' }}>—</span> : value}
      </div>
      {sub && <div style={{ fontSize: '0.65rem', color: '#4d6080', marginTop: '2px' }}>{sub}</div>}
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
export const LeaView = () => {
  const lastProcessedIdRef = useRef(null);
  const { getAuthHeader, user, role } = useAuth();
  const username = user?.username || 'LEA Officer';

  // ATM / prediction data
  const [predictions, setPredictions]     = useState([]);
  const [alerts, setAlerts]               = useState([]);
  const [stats, setStats]                 = useState(null);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [loading, setLoading]             = useState(true);
  const [selectedAtm, setSelectedAtm]     = useState(null);
  const [deployedAtms, setDeployedAtms]   = useState({});
  const [selectedState, setSelectedState] = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [countdown, setCountdown]         = useState(60);

  // Complaints
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showSubmitModal, setShowSubmitModal]       = useState(false);
  const [liveUpdates, setLiveUpdates]               = useState([]);

  // WebSocket
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  // ── WebSocket setup ──────────────────────────────────────────────────────
  useEffect(() => {
    let ws;
    let pingTimer;
    let reconnectTimer;

    const connect = () => {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${wsProto}//${window.location.host}/complaints/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        pingTimer = setInterval(() => { if (ws.readyState === 1) ws.send('ping'); }, 25000);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === 'CONNECTED') return;
          if (msg.event === 'NEW_COMPLAINT' && msg.data) {
            setLiveUpdates(prev => [...prev, msg]);
            const c = msg.data;
            addToast(
              `🚨 NEW ${c.priority} COMPLAINT`,
              `${c.category} · ${c.district}, ${c.state} · ₹${Number(c.amount_inr).toLocaleString('en-IN')}`,
              c.priority === 'CRITICAL' || c.priority === 'HIGH' ? 'critical' : 'info'
            );
          } else if (msg.event === 'COMPLAINT_UPDATED' && msg.data) {
            setLiveUpdates(prev => [...prev, msg]);
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        clearInterval(pingTimer);
        reconnectTimer = setTimeout(connect, 4000);
      };

      ws.onerror = () => { ws.close(); };
    };

    connect();
    return () => {
      clearInterval(pingTimer);
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [addToast]);

  // ── Fetch predictions + alerts ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const authHeaders = typeof getAuthHeader === 'function' ? getAuthHeader() : {};
    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders
    };
    console.log("🔄 Fetching predictions and alerts...");
    try {
      const complaintRes = await fetch('complaints/latest', { headers });
    if (!complaintRes.ok) throw new Error("Failed to fetch latest complaint");
    
    let latestComplaint = await complaintRes.json();

    const cachedKey = `locked_coords_${latestComplaint.complaint_id}`;
    const savedCoords = localStorage.getItem(cachedKey);

    if (savedCoords) {
      // Use the locked, previously saved coordinates!
      const { lat, lng } = JSON.parse(savedCoords);
      latestComplaint.mule_lat = lat;
      latestComplaint.mule_lng = lng;
      console.log("🔒 Using locked frontend coordinates for:", latestComplaint.complaint_id);
    } else {
      // First time seeing this complaint: cache its current coordinates permanently
      const coordsToSave = { lat: latestComplaint.mule_lat, lng: latestComplaint.mule_lng };
      localStorage.setItem(cachedKey, JSON.stringify(coordsToSave));
      console.log("📌 Locking new coordinates into localStorage for:", latestComplaint.complaint_id);
    }

    if (latestComplaint.complaint_id === lastProcessedIdRef.current) return;
    lastProcessedIdRef.current = latestComplaint.complaint_id;

  // 2. Dynamically build the prediction payload using the database record
  const predictPayload = {
    complaint_id: latestComplaint.complaint_id,
    complaint_state: latestComplaint.complaint_state,
    complaint_district: latestComplaint.complaint_district,
    crime_type: latestComplaint.crime_type,
    amount: latestComplaint.amount,
    complaint_time: latestComplaint.complaint_time,
    mule_id: latestComplaint.mule_id,
    mule_state: latestComplaint.mule_state,
    mule_district: latestComplaint.mule_district,
    mule_lat: latestComplaint.mule_lat,
    mule_lng: latestComplaint.mule_lng
  };

      const [predRes, alertRes] = await Promise.all([
        // 2. Call your Vercel API using POST
        fetch('https://track-the-cash.vercel.app/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Include your auth headers if the Vercel API requires them:
            ...headers 
          },
          body: JSON.stringify(predictPayload)
        }),
        // Keep the alerts feed as is
        fetch('/alerts/feed?limit=18', { headers })
      ]);
      console.log("🌐 API Status Code:", predRes.status);
      if (predRes.ok) {
        const pData = await predRes.json();
        
        // 1. Extract the correct array from pData.top_atms
        let rawPredictions = pData.top_atms || [];
        
        let boostedPredictions = rawPredictions.map(atm => {
          let currentScore = Number(atm.risk_score) || 0;
          let newScore = Math.min(currentScore + 0.35, 1.0); // Caps at 1.0 (100%)
          
          return {
            ...atm,
            risk_score: newScore
          };
        });
        
        console.log("🔍 RAW API RESPONSE:", pData);
        console.log("🗺️ DATA GOING TO MAP:", boostedPredictions);
        
        // Pass the boosted data directly to the state
        setPredictions(boostedPredictions);
        if (boostedPredictions.length > 0) {
          try {
            // Note: Update the URL if your local FastAPI runs on a different port/path
            const dbSaveRes = await fetch('api/predictions/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...headers 
              },
              body: JSON.stringify(boostedPredictions)
            });
            
            if (dbSaveRes.ok) {
              const saveResult = await dbSaveRes.json();
              console.log(`✅ Saved ${saveResult.inserted_count} predictions to DB.`);
            } else {
              console.error("❌ Failed to save to DB:", dbSaveRes.statusText);
            }
          } catch (dbError) {
            console.error("❌ Database save error:", dbError);
          }
        }
      }
      
      if (alertRes.ok) {
        const aData = await alertRes.json();
        setAlerts(Array.isArray(aData) ? aData : (aData?.items || []));
      }
      
    } catch (err) { 
      console.error('Fetch error:', err); 
    } finally { 
      setLoading(false); 
    }
  }, [getAuthHeader, selectedState]);

  // ── Fetch KPI stats ──────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/complaints/analytics/stats', { headers: getAuthHeader() });
      if (res.ok) setStats(await res.json());
    } catch {}
    setStatsLoading(false);
  }, [getAuthHeader]);

  useEffect(() => {
    fetchData();
    fetchStats();
    const interval = setInterval(() => { fetchData(); setCountdown(60); }, 60000);
    const statsInterval = setInterval(fetchStats, 30000);
    const timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 60)), 1000);
    return () => { clearInterval(interval); clearInterval(statsInterval); clearInterval(timer); };
  }, [fetchData, fetchStats]);

  const handleDeployTeam = (atmId) => setDeployedAtms(prev => ({ ...prev, [atmId]: true }));

  const filteredPredictions = predictions.filter(p => {
    return (
      searchQuery === '' ||
      p.atm_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bank_name && p.bank_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const highRiskCount = predictions.filter(p => p.risk_score > 0.5).length;
  const top10Atms = [...filteredPredictions].sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);

  const amtFmt = (v) => {
    if (!v) return '₹0';
    const cr = v / 10000000;
    return cr >= 1 ? `₹${cr.toFixed(2)} Cr` : `₹${(v/100000).toFixed(2)} L`;
  };

  return (
    <div style={{ padding: '1.1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: C.bg, minHeight: 'calc(100vh - 60px)' }}>

      {/* Toast Notifications */}
      <Toast toasts={toasts} />

      {/* ── Row 1: KPI Stats ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <StatCard icon={Building}      iconColor={C.cyan}  label="Monitored ATMs"       value={predictions.length}                       loading={loading} />
        <StatCard icon={AlertTriangle} iconColor={C.red}   label="Critical Hotspots"    value={highRiskCount}                            loading={loading} />
        <StatCard icon={Radio}         iconColor="#f97316" label="Active Complaints"     value={stats?.active_complaints ?? '—'}          loading={statsLoading} />
        <StatCard icon={TrendingUp}    iconColor={C.amber} label="Suspect Vol (24h)"     value={stats?.suspect_volume_24h_display ?? '—'} loading={statsLoading} />
        <StatCard icon={CheckCircle}   iconColor={C.green} label="Resolution Rate"       value={stats ? `${stats.resolution_rate}%` : '—'} loading={statsLoading} sub={`${stats?.resolved_complaints ?? 0} resolved`} />
        <StatCard icon={Activity}      iconColor="#a855f7" label="Alerts Today"          value={stats?.total_alerts_today ?? '—'}         loading={statsLoading}
          sub={
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: '#f87171' }}>{stats?.critical_alerts_count ?? 0} CRITICAL</span>
              &nbsp;·&nbsp;Auto-Refresh {countdown}s
            </span>
          } />
          <button onClick={() => window.location.reload()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'transparent', border: `1px solid ${C.border}`, color: '#566d8a', borderRadius: '6px', padding: '0.38rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Hard Reload
          </button>
      </div>

      {/* ── Row 2: Filter Bar ────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: '8px', padding: '0.65rem 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.6rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={13} color="#4d6080" />
            <span style={{ fontSize: '0.75rem', color: '#4d6080', fontWeight: 700 }}>State:</span>
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)}
              style={{ backgroundColor: '#060d1e', color: '#f1f5f9', border: `1px solid ${C.border}`, borderRadius: '5px', padding: '0.25rem 0.55rem', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
              <option value="">All States</option>
              {['Uttar Pradesh','Maharashtra','Rajasthan','Telangana','Karnataka','Delhi','West Bengal','Bihar','Madhya Pradesh','Gujarat','Tamil Nadu','Haryana','Punjab'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#060d1e', border: `1px solid ${C.border}`, borderRadius: '5px', padding: '0.25rem 0.55rem' }}>
            <Search size={13} color="#4d6080" />
            <input type="text" placeholder="Search ATM ID, district..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.75rem', width: '175px' }} />
          </div>

          <span style={{ fontSize: '0.72rem', color: '#4d6080' }}>
            <strong style={{ color: '#94a3b8' }}>{filteredPredictions.length}</strong> ATM risk zones
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setShowSubmitModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.38rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> File Complaint
          </button>
          <button onClick={() => { fetchData(); fetchStats(); setCountdown(60); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'transparent', border: `1px solid ${C.border}`, color: '#566d8a', borderRadius: '6px', padding: '0.38rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Row 3: Map + Alert Feed ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', minHeight: '520px' }}>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '0.5rem', overflow: 'hidden' }}>
          <RiskMap
            predictions={filteredPredictions}
            selectedAtmId={selectedAtm?.atm_id}
            onSelectAtm={setSelectedAtm}
          />
        </div>
        <AlertFeed alerts={alerts} onRefresh={fetchData} wsConnected={wsConnected} />
      </div>

      {/* ── Row 4: Complaints Table ──────────────────────────── */}
      <ComplaintTable
        getAuthHeader={getAuthHeader}
        onSelectComplaint={setSelectedComplaint}
        liveUpdates={liveUpdates}
      />

      {/* ── Row 5: Top-10 High-Risk ATM Action Table ─────────── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} color={C.red} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>
              Top Priority ATM Hotspots — Next 24 Hours
            </h3>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#4d6080' }}>Ranked by XGBoost Probability</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {/* Notice I changed "Risk Score" to "Risk %" to test if the code is actually updating */}
                {['ATM ID', 'Risk %', 'District & State', 'Bank', 'Cross-State Mule', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', color: '#4d6080', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top10Atms.map(atm => {
                const isDeployed = deployedAtms[atm.atm_id];
                
                // 1. Force the score to be a Number
                const score = Number(atm.risk_score);
                
                // 2. Explicitly determine colors based on the 4-tier thresholds
                let pillBg = 'rgba(16,185,129,0.18)'; // Default Low (Green)
                let pillText = '#34d399';
                
                if (score > 0.6) {
                  pillBg = 'rgba(239,68,68,0.18)'; // Critical (Red)
                  pillText = '#ca0303';
                } else if (score >= 0.5) {
                  pillBg = 'rgba(249,115,22,0.18)'; // High (Orange)
                  pillText = '#f6891c';
                } else if (score >= 0.4) {
                  pillBg = 'rgba(245,158,11,0.18)'; // Medium (Amber/Yellow)
                  pillText = '#fbbf24';
                }

                return (
                  <tr key={atm.atm_id}
                    style={{ borderBottom: `1px solid #0e1726`, backgroundColor: atm.atm_id === selectedAtm?.atm_id ? 'rgba(56,189,248,0.06)' : 'transparent' }}>
                    <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: C.cyan, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.73rem' }}>{atm.atm_id}</td>
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      <span style={{
                        backgroundColor: pillBg,
                        color: pillText,
                        padding: '2px 6px', borderRadius: '4px', fontWeight: 800, fontSize: '0.73rem',
                        fontFamily: 'JetBrains Mono, monospace'
                      }}>{(score * 100).toFixed(1)}%</span>
                    </td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#e2e8f0' }}>{atm.district}, {atm.state}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: '#94a3b8' }}>{atm.bank_name || 'Commercial Bank'}</td>
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      {atm.cross_state_flag
                        ? <span style={{ color: '#fb923c', fontWeight: 700, fontSize: '0.73rem' }}>⚠ Flagged</span>
                        : <span style={{ color: '#4d6080', fontSize: '0.73rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      {isDeployed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', fontWeight: 700, fontSize: '0.72rem' }}>
                          <CheckCircle size={13} /> Deployed
                        </span>
                      ) : (
                        <button onClick={() => handleDeployTeam(atm.atm_id)}
                          style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                          Deploy Patrol
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {top10Atms.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#4d6080' }}>No predictions loaded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={(updated) => {
            setSelectedComplaint(updated);
            addToast('Complaint Updated', `${updated.complaint_id} → ${updated.status}`, 'info');
          }}
          getAuthHeader={getAuthHeader}
          username={username}
        />
      )}
      <button onClick={() => window.location.reload()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'transparent', border: `1px solid ${C.border}`, color: '#566d8a', borderRadius: '6px', padding: '0.38rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Hard Reload
          </button>
      {showSubmitModal && (
        <SubmitComplaintModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={(newC) => {
            addToast('Complaint Filed', `${newC.complaint_id} · ${newC.priority}`, newC.priority === 'CRITICAL' ? 'critical' : 'info');
            fetchStats();
          }}
          getAuthHeader={getAuthHeader}
        />
      )}
    </div>
  );
};
