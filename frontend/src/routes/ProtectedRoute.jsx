/**
 * ProtectedRoute.jsx
 *
 * Guards /lea and /admin routes.
 * On every render it:
 *  1. Checks token exists in store
 *  2. Decodes JWT with jwt-decode and verifies exp claim
 *  3. On first valid render, schedules the auto-logout timer
 *  4. Checks role against allowedRoles
 *  5. Redirects to /login if any check fails
 */

import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../store/authStore.js';

/**
 * Decode the JWT and return the payload, or null if invalid / expired.
 */
const decodeToken = (token) => {
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    // exp is in seconds; Date.now() is in milliseconds
    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      return null; // expired
    }
    return payload;
  } catch {
    return null; // malformed
  }
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, isAuthenticated, logout, scheduleAutoLogout, expiresAt } = useAuthStore();
  const location = useLocation();
  const timerScheduled = useRef(false);

  // ── 1. Decode & expiry check ─────────────────────────────────────────────
  const payload = decodeToken(token);

  // Token is missing, malformed, or expired
  if (!token || !isAuthenticated || !user || !payload) {
    // If we had a valid-looking token that is now expired, clean up store
    if (token && isAuthenticated) {
      logout();
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── 2. Role check ────────────────────────────────────────────────────────
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // LEA officer trying to access admin → send to their dashboard
    return <Navigate to="/lea" replace />;
  }

  // ── 3. Schedule auto-logout (only once per mount) ────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!timerScheduled.current && expiresAt) {
      timerScheduled.current = true;
      scheduleAutoLogout(expiresAt);
    }
  }, [expiresAt, scheduleAutoLogout]);

  return <>{children}</>;
};

export default ProtectedRoute;
