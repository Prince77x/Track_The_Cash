import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Map, BarChart3, LogOut, Activity, Terminal, UserCheck } from 'lucide-react';

const S = {
  header: {
    backgroundColor: '#0a1020',
    borderBottom: '1px solid #17233d',
    padding: '0 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    height: '60px',
    boxShadow: '0 1px 0 rgba(0,229,255,0.04)'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    flexShrink: 0
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '0.95rem',
    letterSpacing: '0.03em',
    textDecoration: 'none'
  },
  badge: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    color: '#00e5ff',
    border: '1px solid rgba(0,229,255,0.25)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    fontFamily: 'JetBrains Mono, monospace'
  },
  subtitle: {
    fontSize: '0.68rem',
    color: '#4d6080',
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.03em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderLeft: '1px solid #17233d',
    paddingLeft: '0.8rem'
  },
  nav: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  right: { display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 },
  telemetry: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '5px',
    padding: '0.3rem 0.65rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontFamily: 'JetBrains Mono, monospace'
  },
  userBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '1px'
  },
  roleBadge: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '1px 5px',
    borderRadius: '3px',
    fontFamily: 'JetBrains Mono, monospace'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.65rem',
    backgroundColor: 'rgba(239,68,68,0.08)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '5px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s'
  }
};

function NavLink({ to, icon: Icon, label, isActive, activeColor = '#38bdf8' }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 0.9rem', borderRadius: '5px',
        fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
        color: isActive ? activeColor : '#566d8a',
        backgroundColor: isActive ? `${activeColor}18` : 'transparent',
        border: `1px solid ${isActive ? `${activeColor}40` : 'transparent'}`,
        transition: 'all 0.15s'
      }}
    >
      <Icon size={14} />
      {label}
    </Link>
  );
}

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isAdmin = role === 'admin';
  const isCitizen = role === 'user' || role === 'citizen';
  const isLea = role === 'lea';

  const defaultPath = isAdmin ? '/admin' : (isCitizen ? '/citizen' : '/lea');
  const userIdentifier = isCitizen
    ? (user?.public_user_id || 'TTC-USER-00124')
    : (isAdmin ? 'NATGRID-SYS-001' : `LEA-OFF-${(user?.username || 'lea').slice(-3).toUpperCase()}`);
  const userTitle = user?.full_name || (isAdmin ? 'Director S. Verma' : (isCitizen ? 'Citizen User' : 'LEA Officer'));

  const getRoleBadgeStyle = () => {
    if (isAdmin) {
      return {
        backgroundColor: 'rgba(168,85,247,0.18)',
        color: '#c084fc',
        border: '1px solid rgba(168,85,247,0.3)',
        label: 'ADMIN'
      };
    }
    if (isCitizen) {
      return {
        backgroundColor: 'rgba(16,185,129,0.18)',
        color: '#34d399',
        border: '1px solid rgba(16,185,129,0.3)',
        label: 'CITIZEN'
      };
    }
    return {
      backgroundColor: 'rgba(56,189,248,0.15)',
      color: '#38bdf8',
      border: '1px solid rgba(56,189,248,0.25)',
      label: 'LEA'
    };
  };

  const badgeStyle = getRoleBadgeStyle();

  return (
    <header style={S.header}>
      {/* Brand */}
      <div style={S.brand}>
        <Link to={defaultPath} style={S.brandLogo}>
          <Shield size={17} />
          <span>TRACK<span style={{ color: '#3b82f6' }}>THE</span>CASH</span>
        </Link>
        
        <span style={S.subtitle}>
          {isCitizen ? 'Citizen Cyber Defense & Complaint Intelligence Network' : 'Atm Anomaly Surveillance & Money Mule Interception System'}
        </span>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        {isCitizen ? (
          <NavLink to="/citizen" icon={UserCheck} label="Citizen Portal" isActive={location.pathname === '/citizen'} activeColor="#34d399" />
        ) : (
          <>
            <NavLink to="/lea" icon={Map} label="LEA Surveillance" isActive={location.pathname === '/lea'} />
            {isAdmin && (
              <>
                <NavLink to="/admin" icon={Terminal} label="Admin Center" isActive={location.pathname === '/admin'} activeColor="#a855f7" />
                <NavLink to="/citizen" icon={UserCheck} label="Citizen View" isActive={location.pathname === '/citizen'} activeColor="#34d399" />
              </>
            )}
          </>
        )}
      </nav>

      {/* Right */}
      <div style={S.right}>
        <div style={S.telemetry}>
          <span className="pulse-green" />
          TELEMETRY ACTIVE
        </div>

        <div style={S.userBlock}>
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#e2e8f0' }}>{userTitle}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#4d6080', fontFamily: 'JetBrains Mono, monospace' }}>{userIdentifier}</span>
            <span style={{
              ...S.roleBadge,
              backgroundColor: badgeStyle.backgroundColor,
              color: badgeStyle.color,
              border: badgeStyle.border
            }}>
              {badgeStyle.label}
            </span>
          </div>
        </div>

        <button onClick={handleLogout} title="Logout" style={S.logoutBtn}>
          <LogOut size={13} />
          Exit
        </button>
      </div>
    </header>
  );
};

export default Navbar;
