import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Map, BarChart3, LogOut, Radio, AlertTriangle } from 'lucide-react';

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          color: '#ffffff',
          fontWeight: 800,
          letterSpacing: '0.05em'
        }}>
          <Shield size={20} />
          <span>TRACK THE CASH</span>
        </div>
        <span style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          borderLeft: '1px solid #334155',
          paddingLeft: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Radio size={12} color="#10b981" />
          I4C / MHA PS SIH26184
        </span>
      </div>

      {/* Navigation links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          to="/lea"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
            color: location.pathname === '/lea' ? '#38bdf8' : '#94a3b8',
            backgroundColor: location.pathname === '/lea' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
            border: location.pathname === '/lea' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent'
          }}
        >
          <Map size={16} />
          LEA Heatmap
        </Link>

        {role === 'admin' && (
          <Link
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: location.pathname === '/admin' ? '#a855f7' : '#94a3b8',
              backgroundColor: location.pathname === '/admin' ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
              border: location.pathname === '/admin' ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid transparent'
            }}
          >
            <BarChart3 size={16} />
            Admin Intelligence
          </Link>
        )}
      </nav>

      {/* User profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          fontSize: '0.75rem'
        }}>
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>
            {user?.username}
          </span>
          <span style={{
            color: role === 'admin' ? '#c084fc' : '#38bdf8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {role === 'admin' ? 'I4C Admin Analyst' : 'LEA Field Officer'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.75rem',
            backgroundColor: '#1e293b',
            color: '#f87171',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <LogOut size={14} />
          Exit
        </button>
      </div>
    </header>
  );
};
