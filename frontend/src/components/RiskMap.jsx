import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, AlertTriangle, Building, MapPin, Clock } from 'lucide-react';

// ─── GEOGRAPHIC DICTIONARIES ───────────────────────────────────────────────
const STATE_COORDS = {
  'Maharashtra': [19.7515, 75.7139],
  'Uttar Pradesh': [26.8467, 80.9462],
  'Andhra Pradesh': [15.9129, 79.7400],
  'West Bengal': [22.9868, 87.8550],
  'Rajasthan': [27.0238, 74.2179],
  'Telangana': [18.1124, 79.0193],
  'Karnataka': [15.3173, 75.7139],
  'Delhi': [28.7041, 77.1025],
  'Bihar': [25.0961, 85.3131],
  'Madhya Pradesh': [22.9734, 78.6569],
  'Gujarat': [22.2587, 71.1924],
  'Tamil Nadu': [11.1271, 78.6569],
  'Haryana': [29.0588, 76.0856],
  'Punjab': [31.1471, 75.3412]
};

const DISTRICT_COORDS = {
  'Mumbai': [19.0760, 72.8777],
  'Thane': [19.2183, 72.9781],
  'Aurangabad': [19.8762, 75.3433],
  'Pune': [18.5204, 73.8567],
  'Prayagraj': [25.4358, 81.8463],
  'Agra': [27.1767, 78.0081],
  'Noida': [28.5355, 77.3910],
  'Vijayawada': [16.5062, 80.6480],
  'Visakhapatnam': [17.6868, 83.2185],
  'Siliguri': [26.7271, 88.3953],
  'Jaipur': [26.9124, 75.7873],
  'Hyderabad': [17.3850, 78.4867],
  'Bengaluru': [12.9716, 77.5946]
};

const getJitter = (idStr) => {
  if (!idStr) return { dLat: 0, dLng: 0 };
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const radius = 0.02 + (Math.abs(hash) % 15) * 0.01; 
  const angle = Math.abs(hash) % 360;
  return {
    dLat: radius * Math.cos(angle * Math.PI / 180),
    dLng: radius * Math.sin(angle * Math.PI / 180)
  };
};

// ─── FIXED: Animation injection ──────────────────────────────────────────────
const createRiskIcon = (riskScore, isCrossState, isStale) => {
  let color = '#10b981'; // Default Low (Green)
  let animationStyle = '';
  let shadowStyle = `box-shadow: 0 0 10px ${color}88;`; 
  let dotSize = 16;
  let offset = 3;

  // Directly assign the CSS animation property as an inline style string
  if (riskScore > 0.6) {
    color = '#ff2b2b'; // Critical (Red)
    animationStyle = 'animation: pulse-critical-anim 1.2s infinite ease-in-out;';
    dotSize = 24;
    offset = (22 - dotSize) / 2;
    shadowStyle = ''; 
  } else if (riskScore > 0.5) {
    color = '#ff6600'; // High (Orange)
    animationStyle = 'animation: pulse-high-anim 2s infinite ease-out;';
    shadowStyle = ''; 
  } else if (riskScore >= 0.4) {
    color = '#efef13'; // Medium (Yellow/Amber)
    shadowStyle = `box-shadow: 0 0 10px ${color}88;`; 
  }

  const borderStyle = isStale ? 'border: 2px dashed #94a3b8;' : `border: 2px solid ${color};`;
  const crossBadge = isCrossState
    ? `<div style="position:absolute; top:-6px; right:-6px; background:#f97316; width:10px; height:10px; border-radius:50%; border:1px solid #fff; z-index:10;"></div>`
    : '';

  return L.divIcon({
    html: `
      <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
        <div style="
          width: 16px; height: 16px; background-color: ${color};
          border-radius: 50%; ${borderStyle} ${shadowStyle} ${animationStyle}
        "></div>
        ${crossBadge}
      </div>
    `,
    className: 'custom-atm-marker', // Leaflet needs this to strip default marker styling
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });
};

const CROSS_STATE_FLOWS = [
  { fromState: 'Rajasthan (Jaipur)', toState: 'Uttar Pradesh (Noida)', coords: [[26.9124, 75.7873], [28.5355, 77.3910]], color: '#f97316' },
  { fromState: 'Maharashtra (Mumbai)', toState: 'Telangana (Hyderabad)', coords: [[19.0760, 72.8777], [17.3850, 78.4867]], color: '#a855f7' }
];

export const RiskMap = ({ predictions = [], showFlows = false, selectedAtmId = null, onSelectAtm = () => {} }) => {
  const defaultCenter = [22.9734, 78.6569];
  const defaultZoom = 5;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '560px', position: 'relative' }}>
      
      {/* ─── FIXED: Global Keyframes ───────────────────────────────────────── */}
      <style>{`
        /* Remove default leaflet styles that mess up divIcons */
        .custom-atm-marker { background: none; border: none; }

        @keyframes pulse-critical-anim {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.9); transform: scale(1); }
          50% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); transform: scale(1.15); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
        }

        @keyframes pulse-high-anim {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.8); }
          70% { box-shadow: 0 0 0 12px rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
      `}</style>

      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ width: '100%', height: '100%', minHeight: '560px', borderRadius: '12px' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {predictions.map((atm) => {
          const baseCoords = DISTRICT_COORDS[atm.district] || STATE_COORDS[atm.state] || defaultCenter;
          const { dLat, dLng } = getJitter(atm.atm_id);
          const finalLat = atm.lat || (baseCoords[0] + dLat);
          const finalLng = atm.lng || (baseCoords[1] + dLng);

          if (isNaN(finalLat) || isNaN(finalLng)) return null;

          const icon = createRiskIcon(atm.risk_score, atm.cross_state_flag, atm.stale);
          
          const isCritical = atm.risk_score > 0.6;
          const isHigh = atm.risk_score > 0.5 && atm.risk_score <= 0.6;
          const isMed = atm.risk_score >= 0.4 && atm.risk_score <= 0.5;

          return (
            <Marker key={atm.atm_id} position={[finalLat, finalLng]} icon={icon} eventHandlers={{ click: () => onSelectAtm(atm) }}>
              <Popup>
                <div style={{ padding: '0.4rem', minWidth: '220px', color: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#38bdf8' }}>{atm.atm_id}</span>
                    <span style={{
                      backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.2)' : isHigh ? 'rgba(249, 115, 22, 0.2)' : isMed ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isCritical ? '#f87171' : isHigh ? '#fb923c' : isMed ? '#fbbf24' : '#34d399',
                      border: `1px solid ${isCritical ? '#ef4444' : isHigh ? '#f97316' : isMed ? '#f59e0b' : '#10b981'}`,
                      borderRadius: '4px', padding: '0.15rem 0.4rem', fontSize: '0.75rem', fontWeight: 700
                    }}>
                      Risk: {(atm.risk_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} color="#94a3b8" /> <span>{atm.district}, {atm.state}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Building size={13} color="#94a3b8" /> <span>{atm.bank_name || 'Commercial Bank ATM'}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {showFlows && CROSS_STATE_FLOWS.map((flow, idx) => (
          <Polyline key={idx} positions={flow.coords} pathOptions={{ color: flow.color, weight: 3, dashArray: '6, 8', opacity: 0.85 }}>
            <Tooltip permanent direction="center">
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: flow.color }}>{flow.fromState} ➔ {flow.toState}</span>
            </Tooltip>
          </Polyline>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '16px', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
        border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.9rem', zIndex: 500, fontSize: '0.75rem',
        display: 'flex', flexDirection: 'column', gap: '0.35rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.1rem' }}>24-Hour Cash-Out Risk</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
          <span style={{ color: '#fca5a5' }}>Critical (&gt; 60%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316' }}></span>
          <span style={{ color: '#fdba74' }}>High (50%–60%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
          <span style={{ color: '#fde68a' }}>Medium (40%–50%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span style={{ color: '#86efac' }}>Low Risk (&lt; 40%)</span>
        </div>
      </div>
    </div>
  );
};