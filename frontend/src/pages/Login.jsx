import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Key, User, Fingerprint, Clock, Zap, ChevronRight, AlertCircle } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('lea_user');
  const [password, setPassword] = useState('lea_pass');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/lea');
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#080b13',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.10) 0%, transparent 55%)',
      padding: '1.5rem',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#0c1120',
        border: '1px solid #1c2436',
        borderRadius: '14px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        padding: '2.5rem',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b5bfd 0%, #2541c9 100%)',
            color: '#fff',
            marginBottom: '1.1rem',
            boxShadow: '0 0 24px rgba(59, 91, 253, 0.55)'
          }}>
            <Shield size={30} fill="currentColor" fillOpacity={0.15} />
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '0.01em' }}>
            <span style={{ color: '#f1f5f9' }}>TRACK</span>
            <span style={{ color: '#3b82f6' }}>THE</span>
            <span style={{ color: '#f1f5f9' }}>CASH</span>
          </h1>
          <p style={{
            fontSize: '0.78rem',
            color: '#7c8aa5',
            margin: '0 0 0.9rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}>
            National Cash Flow Intelligence Terminal
          </p>
          <div style={{
            display: 'inline-block',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            backgroundColor: '#131a2c',
            border: '1px solid #232d44',
            fontSize: '0.7rem',
            color: '#8b96ad',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Restricted Government Access
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#f87171',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Judge Demo Login */}
        <div style={{
          backgroundColor: '#0f1526',
          border: '1px solid #1c2436',
          borderRadius: '10px',
          padding: '1rem 1.1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#7dd3fc',
              letterSpacing: '0.03em'
            }}>
              <Zap size={13} fill="currentColor" />
              QUICK JUDGE DEMO LOGIN:
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              color: '#64748b'
            }}>
              <Clock size={12} />
              8-hr session
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('lea_user', 'lea_pass')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                backgroundColor: '#1d3fb8',
                color: '#e0e9ff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem 0.6rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <User size={15} />
              LEA Officer
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin_user', 'admin_pass')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                backgroundColor: '#7a4a17',
                color: '#ffd9a3',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem 0.6rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Fingerprint size={15} />
              Admin Director
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#93a1bd',
              marginBottom: '0.5rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Officer Credential Identifier
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0a0e19',
              border: '1px solid #232d44',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              gap: '0.6rem'
            }}>
              <Lock size={16} color="#5b6b8c" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="officer.identifier"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  width: '100%',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#93a1bd',
              marginBottom: '0.5rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Encryption Key / Passphrase
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0a0e19',
              border: '1px solid #232d44',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              gap: '0.6rem'
            }}>
              <Key size={16} color="#5b6b8c" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  width: '100%',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #3b5bfd 0%, #5b3bfd 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.85rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '0.25rem',
              boxShadow: '0 8px 20px -4px rgba(59, 91, 253, 0.5)'
            }}
          >
            {loading ? 'Authenticating...' : 'Access Surveillance Network'}
            <ChevronRight size={18} />
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #1c2436',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.68rem', color: '#576079', margin: 0, letterSpacing: '0.04em' }}>
            AUTHENTICATED VIA FIU-IND SECURE GATEWAY • SESSION LIMIT: 8 HRS
          </p>
        </div>
      </div>
    </div>
  );
};
