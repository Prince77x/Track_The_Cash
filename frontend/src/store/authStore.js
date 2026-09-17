/**
 * authStore.js
 * Zustand auth store with:
 *  - token, role, user, isAuthenticated, expiresAt
 *  - localStorage persistence on login / clear on logout
 *  - auto-logout timer management (8-hour cap enforced by ProtectedRoute)
 */

import { create } from 'zustand';

// ─── helpers ────────────────────────────────────────────────────────────────

const loadFromStorage = (key, parse = false) => {
  try {
    const value = localStorage.getItem(key);
    return value ? (parse ? JSON.parse(value) : value) : null;
  } catch {
    return null;
  }
};

// ─── initial hydration ───────────────────────────────────────────────────────

const storedToken = loadFromStorage('token');
const storedUser  = loadFromStorage('user', true);
const storedExpAt = loadFromStorage('expiresAt');

// Treat session as expired if the stored exp has already passed
const isExpired = storedExpAt ? Date.now() > Number(storedExpAt) : false;
const initialAuthenticated = Boolean(storedToken && storedUser && !isExpired);

// If it was expired, clean up immediately so we start clean
if (storedToken && isExpired) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
}

// ─── store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create((set, get) => ({
  user: initialAuthenticated ? storedUser : null,
  token: initialAuthenticated ? storedToken : null,
  expiresAt: initialAuthenticated ? Number(storedExpAt) : null,
  isAuthenticated: initialAuthenticated,

  /** Store-internal reference to the auto-logout timer */
  _autoLogoutTimerId: null,

  /**
   * Call after a successful login.
   * @param {string} token  - JWT string
   * @param {object} user   - { id, username, name, role, badgeNumber, agency }
   * @param {number} expiresAt - Unix timestamp (ms) when the token expires
   */
  login: (token, user, expiresAt) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('expiresAt', String(expiresAt));
    set({ token, user, expiresAt, isAuthenticated: true });
  },

  /**
   * Clear session immediately (called on logout button, 401, or timer fire).
   */
  logout: () => {
    const { _autoLogoutTimerId } = get();
    if (_autoLogoutTimerId) clearTimeout(_autoLogoutTimerId);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
    set({
      token: null,
      user: null,
      expiresAt: null,
      isAuthenticated: false,
      _autoLogoutTimerId: null,
    });
  },

  /**
   * Schedule an automatic logout at `expiresAt`, capped at 8 hours from now.
   * Safe to call multiple times — clears the previous timer first.
   * The actual redirect is handled by ProtectedRoute re-evaluating isAuthenticated.
   */
  scheduleAutoLogout: (expiresAt) => {
    const { _autoLogoutTimerId, logout } = get();
    if (_autoLogoutTimerId) clearTimeout(_autoLogoutTimerId);

    const MAX_SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours
    const msUntilExpiry = expiresAt - Date.now();
    const delay = Math.min(msUntilExpiry, MAX_SESSION_MS);

    if (delay <= 0) {
      logout();
      return;
    }

    const timerId = setTimeout(() => {
      console.info('[Auth] Session expired — auto-logout triggered.');
      get().logout();
      // Redirect to login if still on a protected page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }, delay);

    set({ _autoLogoutTimerId: timerId });
  },
}));

export default useAuthStore;
