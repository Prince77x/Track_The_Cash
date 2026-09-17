import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, Clock, Radio } from 'lucide-react';

export const AlertFeed = ({ alerts = [], onRefresh = () => {} }) => {
  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '560px'
    }}>
      {/* Feed Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #1e293b',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={16} color="#ef4444" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Live Alert Feed
          </h3>
        </div>
        <span style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          padding: '0.15rem 0.5rem',
          borderRadius: '999px',
          fontSize: '0.7rem',
          fontWeight: 700
        }}>
          {alerts.length} Active
        </span>
      </div>

      {/* Feed List */}
      <div style={{
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        paddingRight: '0.25rem'
      }}>
        {alerts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            color: '#64748b',
            fontSize: '0.85rem'
          }}>
            <ShieldCheck size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            No active velocity spikes detected in monitored jurisdictions.
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const isCritical = alert.severity === 'CRITICAL';
            const timeFormatted = alert.detected_at
              ? new Date(alert.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent';

            return (
              <div
                key={alert.alert_id || idx}
                style={{
                  backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  borderLeft: `4px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: '6px',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isCritical ? (
                      <AlertCircle size={14} color="#ef4444" />
                    ) : (
                      <AlertTriangle size={14} color="#f59e0b" />
                    )}
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      color: isCritical ? '#f87171' : '#fbbf24',
                      textTransform: 'uppercase'
                    }}>
                      {alert.severity} • {alert.district}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={10} />
                    {timeFormatted}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.3 }}>
                  {alert.message || `Velocity spike detected: ${alert.complaint_count} complaints in 6h`}
                </p>

                {alert.cross_state && (
                  <div style={{ fontSize: '0.68rem', color: '#fb923c', fontWeight: 600 }}>
                    ⚡ Cross-state mule accounts detected
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
