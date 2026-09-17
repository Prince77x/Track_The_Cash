import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RiskMap } from '../components/RiskMap';
import { AlertFeed } from '../components/AlertFeed';
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  CheckCircle,
  ExternalLink,
  MapPin,
  Building,
  Radio
} from 'lucide-react';

export const LeaView = () => {
  const { getAuthHeader } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [deployedAtms, setDeployedAtms] = useState({});
  const [countdown, setCountdown] = useState(60);

  const fetchData = async () => {
    try {
      const headers = getAuthHeader();
      let url = '/predict?limit=250';
      if (selectedState) {
        url += `&state=${encodeURIComponent(selectedState)}`;
      }

      const [predRes, alertRes] = await Promise.all([
        fetch(url, { headers }),
        fetch('/alerts/feed?limit=15', { headers })
      ]);

      if (predRes.ok) {
        const predData = await predRes.json();
        setPredictions(predData.predictions || []);
      }

      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setAlerts(alertData || []);
      }
    } catch (err) {
      console.error('Failed to fetch LEA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setCountdown(60);
    }, 60000);

    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [selectedState]);

  const handleDeployTeam = (atmId) => {
    setDeployedAtms((prev) => ({
      ...prev,
      [atmId]: true
    }));
  };

  // Filtered ATMs
  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.atm_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.bank_name && p.bank_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const highRiskCount = predictions.filter((p) => p.risk_score > 0.7).length;
  const top10Atms = [...filteredPredictions].sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);

  return (
    <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#0b0f19', minHeight: 'calc(100vh - 65px)' }}>
      {/* Top Banner / Stats Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Stat 1 */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '0.65rem', borderRadius: '8px', color: '#38bdf8' }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Monitored ATMs</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{predictions.length}</div>
          </div>
        </div>

        {/* Stat 2 */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.65rem', borderRadius: '8px', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, textTransform: 'uppercase' }}>Critical Risk Hotspots</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fca5a5' }}>{highRiskCount}</div>
          </div>
        </div>

        {/* Stat 3 */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: '0.65rem', borderRadius: '8px', color: '#f97316' }}>
            <Radio size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#fdba74', fontWeight: 600, textTransform: 'uppercase' }}>Active Alert Feeds</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fed7aa' }}>{alerts.length}</div>
          </div>
        </div>

        {/* Stat 4 */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Auto-Refresh</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>Next in {countdown}s</div>
          </div>
          <button
            onClick={fetchData}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* State Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="#94a3b8" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Filter State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '0.35rem 0.6rem',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Monitored States</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Telangana">Telangana</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Delhi">Delhi</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Bihar">Bihar</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Gujarat">Gujarat</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '0.3rem 0.6rem',
            gap: '0.4rem'
          }}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Search ATM ID, district, bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.8rem',
                width: '200px'
              }}
            />
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Showing <strong>{filteredPredictions.length}</strong> ATM risk zones
        </div>
      </div>

      {/* Main Grid: Map & Alert Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Left: Map */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '0.75rem', height: '580px' }}>
          <RiskMap
            predictions={filteredPredictions}
            selectedAtmId={selectedAtm?.atm_id}
            onSelectAtm={(atm) => setSelectedAtm(atm)}
          />
        </div>

        {/* Right: Alert Feed */}
        <div>
          <AlertFeed alerts={alerts} onRefresh={fetchData} />
        </div>
      </div>

      {/* Bottom: Top-10 High-Risk Action Table */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Top Priority High-Risk ATM Hotspots (Next 24h)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Ranked by XGBoost Probability
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.6rem 0.8rem' }}>ATM ID</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Risk Score</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>District & State</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Bank</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Cross-State Mule</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {top10Atms.map((atm) => {
                const isDeployed = deployedAtms[atm.atm_id];
                const isHigh = atm.risk_score > 0.7;

                return (
                  <tr
                    key={atm.atm_id}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      backgroundColor: atm.atm_id === selectedAtm?.atm_id ? 'rgba(56, 189, 248, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                      {atm.atm_id}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{
                        backgroundColor: isHigh ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isHigh ? '#f87171' : '#fbbf24',
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        {(atm.risk_score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#e2e8f0' }}>
                      {atm.district}, {atm.state}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#cbd5e1' }}>
                      {atm.bank_name || 'Commercial Bank'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      {atm.cross_state_flag ? (
                        <span style={{ color: '#fb923c', fontWeight: 700, fontSize: '0.72rem' }}>
                          ⚠️ Yes (Flagged)
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>No</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      {isDeployed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>
                          <CheckCircle size={14} />
                          Field Team Deployed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeployTeam(atm.atm_id)}
                          style={{
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Deploy Patrol Team
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
