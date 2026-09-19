import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, AlertTriangle, Building, MapPin, Clock, Layers } from 'lucide-react';

// Create custom leaflet DivIcons for clean colored radar markers
const createRiskIcon = (riskScore, isCrossState, isStale) => {
  let color = '#10b981'; // Green < 0.4
  let ringClass = '';

  if (riskScore > 0.7) {
    color = '#ef4444'; // Red > 0.7
    ringClass = 'pulse-red';
  } else if (riskScore >= 0.4) {
    color = '#f59e0b'; // Amber 0.4-0.7
  }

  const borderStyle = isStale ? 'border: 2px dashed #94a3b8;' : `border: 2px solid ${color};`;
  const crossBadge = isCrossState
    ? `<div style="position:absolute; top:-6px; right:-6px; background:#f97316; width:10px; height:10px; border-radius:50%; border:1px solid #fff;"></div>`
    : '';

  const html = `
    <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
      <div class="${ringClass}" style="
        width: 16px;
        height: 16px;
        background-color: ${color};
        border-radius: 50%;
        ${borderStyle}
        box-shadow: 0 0 10px ${color}88;
      "></div>
      ${crossBadge}
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-atm-marker',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });
};

// Cross-state mule flow coordinate vectors (e.g. Rajasthan -> UP, Maharashtra -> Karnataka)
const CROSS_STATE_FLOWS = [
  {
    fromState: 'Rajasthan (Jaipur)',
    toState: 'Uttar Pradesh (Noida)',
    coords: [[26.9124, 75.7873], [28.5355, 77.3910]],
    color: '#f97316'
  },
  {
    fromState: 'Maharashtra (Mumbai)',
    toState: 'Telangana (Hyderabad)',
    coords: [[19.0760, 72.8777], [17.3850, 78.4867]],
    color: '#a855f7'
  }
];

export const RiskMap = ({
  predictions = [],
  showFlows = false,
  selectedAtmId = null,
  onSelectAtm = () => {}
}) => {
  // Center of India
  const defaultCenter = [22.9734, 78.6569];
  const defaultZoom = 5;

  // Check for optional custom API key or tile URL in env
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.VITE_MAP_API_KEY || '';
  const customTileUrl = import.meta.env.VITE_MAP_TILE_URL;

  // Selected base tile style
  const [tileStyle, setTileStyle] = useState('carto_dark');

  const getTileConfig = () => {
    if (customTileUrl) {
      return {
        url: customTileUrl,
        attribution: '&copy; Custom Tile Provider'
      };
    }

    if (tileStyle === 'mapbox' && mapboxToken) {
      return {
        url: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
        attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
      };
    }

    if (tileStyle === 'osm_standard') {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      };
    }

    // Default Carto Dark (Keyless and fast)
    return {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
    };
  };

  const tileConfig = getTileConfig();

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '560px', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%', minHeight: '560px', borderRadius: '12px' }}
      >
        <TileLayer
          key={tileStyle}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={19}
        />

        {/* ATM Risk Markers */}
        {predictions.map((atm) => {
          const icon = createRiskIcon(atm.risk_score, atm.cross_state_flag, atm.stale);
          const isHigh = atm.risk_score > 0.7;
          const isMed = atm.risk_score >= 0.4 && atm.risk_score <= 0.7;

          return (
            <Marker
              key={atm.atm_id}
              position={[atm.lat, atm.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectAtm(atm)
              }}
            >
              <Popup>
                <div style={{ padding: '0.4rem', minWidth: '220px', color: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#38bdf8' }}>
                      {atm.atm_id}
                    </span>
                    <span style={{
                      backgroundColor: isHigh ? 'rgba(239, 68, 68, 0.2)' : isMed ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isHigh ? '#f87171' : isMed ? '#fbbf24' : '#34d399',
                      border: `1px solid ${isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981'}`,
                      borderRadius: '4px',
                      padding: '0.15rem 0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      Risk: {(atm.risk_score * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} color="#94a3b8" />
                      <span>{atm.district}, {atm.state}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Building size={13} color="#94a3b8" />
                      <span>{atm.bank_name || 'Commercial Bank ATM'}</span>
                    </div>

                    {atm.cross_state_flag && (
                      <div style={{
                        marginTop: '0.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor: 'rgba(249, 115, 22, 0.15)',
                        color: '#fb923c',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontSize: '0.72rem'
                      }}>
                        <ShieldAlert size={12} />
                        Cross-State Mule Linkage
                      </div>
                    )}

                    {atm.stale && (
                      <div style={{
                        marginTop: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor: 'rgba(148, 163, 184, 0.15)',
                        color: '#94a3b8',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem'
                      }}>
                        <Clock size={11} />
                        Stale (&gt;24h since prediction)
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Cross-State Mule Flow Arrows for Admin View */}
        {showFlows && CROSS_STATE_FLOWS.map((flow, idx) => (
          <Polyline
            key={idx}
            positions={flow.coords}
            pathOptions={{
              color: flow.color,
              weight: 3,
              dashArray: '6, 8',
              opacity: 0.85
            }}
          >
            <Tooltip permanent direction="center">
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: flow.color }}>
                {flow.fromState} ➔ {flow.toState}
              </span>
            </Tooltip>
          </Polyline>
        ))}
      </MapContainer>

      {/* Map Style Selector Toggle (Top Right) */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '0.4rem 0.6rem',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
      }}>
        <Layers size={14} color="#38bdf8" />
        <select
          value={tileStyle}
          onChange={(e) => setTileStyle(e.target.value)}
          style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #475569',
            borderRadius: '4px',
            padding: '0.2rem 0.4rem',
            fontSize: '0.75rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="carto_dark">🌙 Dark Map (CARTO - Free)</option>
          <option value="osm_standard">🗺️ Standard Street (OpenStreetMap - Free)</option>
          {mapboxToken && <option value="mapbox">🛰️ Mapbox Dark (Custom Key)</option>}
        </select>
      </div>

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '0.6rem 0.9rem',
        zIndex: 500,
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.1rem' }}>24-Hour Cash-Out Risk</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
          <span style={{ color: '#fca5a5' }}>High Risk (&gt; 70%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
          <span style={{ color: '#fde68a' }}>Medium (40%–70%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span style={{ color: '#86efac' }}>Low Risk (&lt; 40%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid #334155', paddingTop: '0.3rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }}></span>
          <span style={{ color: '#fdba74' }}>Cross-State Mule Flag</span>
        </div>
      </div>
    </div>
  );
};
