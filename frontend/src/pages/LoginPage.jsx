/**
 * LoginPage.jsx
 *
 * Milestone 1 — Auth flow:
 *  - Standard username/password form → POST /auth/login via authApi
 *  - On success → store token+user+expiresAt → role-based redirect
 *  - On 401 from server → inline "Invalid credentials" message
 *  - On other errors → generic "Authentication failed" message
 *  - One-click hackathon demo buttons for LEA Officer and Admin Director
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  UserCheck,
  KeyRound,
  AlertTriangle,
  ChevronRight,
  Fingerprint,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { authApi } from '../api/authApi.js';
import { MOCK_USERS } from '../mock/mockData.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Map an axios / fetch error to a user-friendly message */
const mapError = (err) => {
  const status = err?.response?.status;
  if (status === 401) return 'Invalid credentials. Please check your identifier and passphrase.';
  if (status === 403) return 'Access denied. Your account does not have the required clearance.';
  if (status === 429) return 'Too many attempts. Please wait before retrying.';
  if (status >= 500) return 'Authentication server unavailable. Please try again shortly.';
  return err?.message || 'Authentication failed. Please verify credentials.';
};

// ─── component ───────────────────────────────────────────────────────────────

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const { login } = useAuthStore();
  const navigate  = useNavigate();

  // ── Core submit handler ───────────────────────────────────────────────────

  const handleLogin = async (e, overrides = {}) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const credentials = {
      username: overrides.username ?? username,
      password: overrides.password ?? password,
      ...(overrides.role ? { role: overrides.role } : {}),
    };

    try {
      const res = await authApi.login(credentials);
      // res → { token, user, expiresAt }
      login(res.token, res.user, res.expiresAt);
      navigate(res.user.role === 'admin' ? '/admin' : '/lea', { replace: true });
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Quick demo handler ────────────────────────────────────────────────────

  const handleQuickDemo = (selectedRole) => {
    const mockUser = selectedRole === 'admin' ? MOCK_USERS.admin : MOCK_USERS.lea;
    handleLogin(null, { username: mockUser.username, password: 'demo', role: selectedRole });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-lea-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-lea-950 to-lea-950 -z-10" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl -z-10 animate-pulse pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md bg-lea-900/90 border border-lea-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/40 mb-3">
            <Shield className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            TRACK<span className="text-sky-400">THE</span>CASH
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-1">
            National Cash Flow Intelligence Terminal
          </p>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono">RESTRICTED GOVERNMENT ACCESS</span>
          </div>
        </div>

        {/* Quick demo buttons */}
        <div className="mb-6 p-3 bg-lea-850/80 border border-lea-700/50 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="text-sky-400 font-mono">⚡ QUICK JUDGE DEMO LOGIN:</span>
            <span className="text-[10px] text-slate-500 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>8-hr session</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="quick-login-lea"
              onClick={() => handleQuickDemo('lea')}
              disabled={loading}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-sky-300 border border-blue-500/40 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>LEA Officer</span>
            </button>
            <button
              type="button"
              id="quick-login-admin"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Admin Director</span>
            </button>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Inline error message (covers 401 / network errors) */}
          {error && (
            <div
              id="login-error-banner"
              role="alert"
              className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-lg flex items-start space-x-2 text-rose-300 text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="login-username" className="block text-xs font-mono text-slate-300 mb-1.5">
              OFFICER CREDENTIAL IDENTIFIER
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="officer.identifier"
                required
                className="w-full pl-9 pr-3 py-2 bg-lea-950 border border-lea-700 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition font-mono"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-xs font-mono text-slate-300 mb-1.5">
              ENCRYPTION KEY / PASSPHRASE
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-lea-950 border border-lea-700 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition font-mono"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-mono text-xs">AUTHENTICATING CIPHER...</span>
              </>
            ) : (
              <>
                <span>Access Surveillance Network</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-lea-800 text-center text-[10px] text-slate-500 font-mono">
          AUTHENTICATED VIA FIU-IND SECURE GATEWAY &bull; SESSION LIMIT: 8 HRS
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
