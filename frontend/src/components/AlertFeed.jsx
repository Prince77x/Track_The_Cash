import React, { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, Clock, Radio, Wifi, WifiOff } from 'lucide-react';

export const AlertFeed = ({ alerts = [], onRefresh = () => {}, wsConnected = false }) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [alerts]);

  return (
    <div style={{
      backgroundColor: '#0c1322',
      border: '1px solid #17233d',
      borderRadius: '12px',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '580px',
      overflow: 'hidden'
    }}>
      {/* Feed Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem', borderBottom: '1px solid #17233d',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={15} color="#ef4444" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9' }}>Live Threat Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: wsConnected ? '#10b981' : '#f87171' }}>
            {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </span>
          <span style={{
            backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171',
            padding: '1px 7px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700
          }}>{alerts.length}</span>
        </div>
      </div>

      {/* Feed List */}
      <div ref={listRef} style={{ overflowY: 'auto', flex: 1, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#4d6080', fontSize: '0.82rem' }}>
            <ShieldCheck size={30} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
            No velocity spikes detected.
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const isCritical = alert.severity === 'CRITICAL';
            const timeFormatted = alert.detected_at
              ? new Date(alert.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent';

            return (
              <div key={alert.alert_id || idx} style={{
                backgroundColor: isCritical ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)',
                borderLeft: `3px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
                borderRadius: '6px',
                padding: '0.6rem 0.75rem',
                display: 'flex', flexDirection: 'column', gap: '0.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {isCritical
                      ? <AlertCircle size={13} color="#ef4444" />
                      : <AlertTriangle size={13} color="#f59e0b" />}
                    <span style={{
                      fontWeight: 800, fontSize: '0.72rem',
                      color: isCritical ? '#f87171' : '#fbbf24',
                      textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>
                      {alert.severity} · {alert.district}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: '#4d6080', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={9} /> {timeFormatted}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.73rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {alert.message || `Velocity spike: ${alert.complaint_count} complaints in 6h`}
                </p>

                {alert.cross_state && (
                  <div style={{ fontSize: '0.67rem', color: '#fb923c', fontWeight: 700 }}>
                    ⚡ Cross-state mule accounts flagged
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
