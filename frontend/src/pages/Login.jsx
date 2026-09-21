import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Key, User, Fingerprint, Clock, Zap, ChevronRight, AlertCircle, UserPlus, UserCheck, Phone, Mail, MapPin } from 'lucide-react';

export const Login = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('lea_user');
  const [password, setPassword] = useState('lea_pass');

  // Registration form fields
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    address: ''
  });

  const { login, register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'user' || data.role === 'citizen') {
        navigate('/citizen');
      } else {
        navigate('/lea');
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await register(regForm);
      navigate('/citizen');
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const handleQuickFill = (u, p) => {
    setIsRegisterMode(false);
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
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.12) 0%, transparent 60%)',
      padding: '1.5rem',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace"
    }}>
      <div style={{
        width: '100%',
        maxWidth: isRegisterMode ? '580px' : '500px',
        backgroundColor: '#0c1120',
        border: '1px solid #1c2436',
        borderRadius: '14px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        padding: '2.5rem',
        position: 'relative',
        transition: 'max-width 0.2s ease'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b5bfd 0%, #2541c9 100%)',
            color: '#fff',
            marginBottom: '0.9rem',
            boxShadow: '0 0 24px rgba(59, 91, 253, 0.55)'
          }}>
            <Shield size={28} fill="currentColor" fillOpacity={0.15} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.4rem', letterSpacing: '0.01em' }}>
            <span style={{ color: '#f1f5f9' }}>TRACK</span>
            <span style={{ color: '#3b82f6' }}>THE</span>
            <span style={{ color: '#f1f5f9' }}>CASH</span>
          </h1>
          <p style={{
            fontSize: '0.74rem',
            color: '#7c8aa5',
            margin: '0 0 0.8rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}>
            National Cybercrime Intelligence Network
          </p>
          <div style={{
            display: 'inline-block',
            padding: '0.3rem 0.8rem',
            borderRadius: '999px',
            backgroundColor: '#131a2c',
            border: '1px solid #232d44',
            fontSize: '0.68rem',
            color: '#8b96ad',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            {isRegisterMode ? 'Citizen Registration Portal' : 'Law Enforcement & Citizen Terminal'}
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          backgroundColor: '#080d1a',
          border: '1px solid #1c2436',
          borderRadius: '8px',
          padding: '0.3rem',
          marginBottom: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => setIsRegisterMode(false)}
            style={{
              padding: '0.55rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: !isRegisterMode ? '#1e293b' : 'transparent',
              color: !isRegisterMode ? '#38bdf8' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Terminal Login
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            style={{
              padding: '0.55rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isRegisterMode ? '#1e293b' : 'transparent',
              color: isRegisterMode ? '#38bdf8' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Citizen Sign-Up
          </button>
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
            fontSize: '0.82rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Judge Demo Login (Only in Login Mode) */}
        {!isRegisterMode && (
          <div style={{
            backgroundColor: '#0f1526',
            border: '1px solid #1c2436',
            borderRadius: '10px',
            padding: '0.9rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#7dd3fc',
                letterSpacing: '0.03em'
              }}>
                <Zap size={13} fill="currentColor" />
                QUICK JUDGE EVALUATION LOGIN:
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.68rem',
                color: '#64748b'
              }}>
                <Clock size={12} />
                8-hr token
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('lea_user', 'lea_pass')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#1d3fb8',
                  color: '#e0e9ff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 0.4rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <User size={13} />
                LEA Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin_user', 'admin_pass')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#7a4a17',
                  color: '#ffd9a3',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 0.4rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <Fingerprint size={13} />
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('demo_citizen', 'citizen123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#047857',
                  color: '#a7f3d0',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.6rem 0.4rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <UserCheck size={13} />
                Citizen
              </button>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {!isRegisterMode ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#93a1bd',
                marginBottom: '0.4rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Officer / Citizen Identifier
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#0a0e19',
                border: '1px solid #232d44',
                borderRadius: '8px',
                padding: '0.7rem 0.85rem',
                gap: '0.6rem'
              }}>
                <Lock size={15} color="#5b6b8c" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="identifier or email"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f8fafc',
                    width: '100%',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#93a1bd',
                marginBottom: '0.4rem',
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
                padding: '0.7rem 0.85rem',
                gap: '0.6rem'
              }}>
                <Key size={15} color="#5b6b8c" />
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
                    fontSize: '0.88rem',
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
                padding: '0.8rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 8px 20px -4px rgba(59, 91, 253, 0.5)'
              }}
            >
              {loading ? 'Authenticating...' : 'Access Intelligence Terminal'}
              <ChevronRight size={17} />
            </button>
          </form>
        ) : (
          /* CITIZEN REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  placeholder="Rohan Mehta"
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0e19',
                    border: '1px solid #232d44',
                    color: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  placeholder="rohan_mehta"
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0e19',
                    border: '1px solid #232d44',
                    color: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="rohan@example.com"
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0e19',
                    border: '1px solid #232d44',
                    color: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Mobile Phone *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0e19',
                    border: '1px solid #232d44',
                    color: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Secure Passphrase *
              </label>
              <input
                type="password"
                required
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  backgroundColor: '#0a0e19',
                  border: '1px solid #232d44',
                  color: '#f8fafc',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.state}
                  onChange={(e) => setRegForm({ ...regForm, state: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0e19',
                    border: '1px solid #232d44',
                    color: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  District *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.district}
                  onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0e19',
                    border: '1px solid #232d44',
                    color: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#93a1bd', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0e19',
                    border: '1px solid #232d44',
                    color: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem'
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
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.8rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '0.5rem',
                boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.4)'
              }}
            >
              {loading ? 'Creating Citizen Profile...' : 'Register & Enter Citizen Portal'}
              <ChevronRight size={17} />
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #1c2436',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.65rem', color: '#576079', margin: 0, letterSpacing: '0.04em' }}>
            AUTHENTICATED VIA FIU-IND SECURE GATEWAY • SESSION LIMIT: 8 HRS
          </p>
        </div>
      </div>
    </div>
  );
};
