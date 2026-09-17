/**
 * authApi.js
 * Backend contract: POST /auth/login → { token, role, expiresAt }
 *
 * In mock mode: builds a valid Base64-encoded JWT-shaped token so that
 * jwt-decode works correctly on it (no real crypto signing required).
 */

import axiosClient from './axiosClient.js';
import { CONFIG } from '../config.js';
import { MOCK_USERS } from '../mock/mockData.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a mock JWT string with a proper header.payload.signature structure.
 * jwt-decode only reads the payload (no verification), so fake sig is fine.
 */
const buildMockJwt = (payload) => {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = btoa(JSON.stringify(payload));
  const sig     = btoa('mock-signature');
  // btoa may contain '+', '/', '=' — replace for URL-safe base64 (jwt-decode handles both)
  return `${header}.${body}.${sig}`;
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Login.
   * Returns { token: string, user: object, expiresAt: number (ms) }
   * so callers don't need to re-decode the JWT to learn the expiry.
   *
   * Real backend MUST return: { token, role, expiresAt }
   * The `user` object is fetched/derived from the token payload or /auth/me.
   */
  login: async (credentials) => {
    if (CONFIG.USE_MOCK_DATA) {
      // Simulate network round-trip
      await new Promise((resolve) => setTimeout(resolve, 350));

      const role = credentials.role
        || (credentials.username?.toLowerCase().includes('admin') ? 'admin' : 'lea');

      const user = role === 'admin' ? MOCK_USERS.admin : MOCK_USERS.lea;

      // Token expires in 8 hours from now (mock)
      const expSeconds = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
      const expiresAt  = expSeconds * 1000; // ms for store

      const token = buildMockJwt({
        sub: user.id,
        username: user.username,
        role: user.role,
        badgeNumber: user.badgeNumber,
        iat: Math.floor(Date.now() / 1000),
        exp: expSeconds,
      });

      return { token, user, expiresAt };
    }

    // ── Real backend path ──
    // POST /auth/login → { token, role, expiresAt }
    const response = await axiosClient.post('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    });

    const { token, role, expiresAt } = response.data;

    // Fetch full user profile (name, badgeNumber, agency…)
    const userResponse = await axiosClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return { token, user: { ...userResponse.data, role }, expiresAt };
  },

  /** Refresh token silently (optional — call from axiosClient interceptor) */
  refreshToken: async () => {
    if (CONFIG.USE_MOCK_DATA) return null;
    const response = await axiosClient.post('/auth/refresh');
    return response.data; // { token, expiresAt }
  },

  /** Invalidate session on the server side */
  logout: async () => {
    if (!CONFIG.USE_MOCK_DATA) {
      try {
        await axiosClient.post('/auth/logout');
      } catch (err) {
        // Non-critical — local state is already cleared
        console.warn('[Auth] Server-side logout failed or ignored:', err?.message);
      }
    }
  },

  /** Fetch the current user's profile (used after page refresh) */
  getCurrentUser: async () => {
    if (CONFIG.USE_MOCK_DATA) {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : MOCK_USERS.lea;
    }
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },
};

export default authApi;
