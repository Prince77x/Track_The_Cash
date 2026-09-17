import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage.jsx';
import LEADashboard from '../pages/LEADashboard.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useAuthStore } from '../store/authStore.js';

export const AppRouter = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'admin' ? '/admin' : '/lea'} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Protected LEA Officer Dashboard */}
        <Route
          path="/lea"
          element={
            <ProtectedRoute allowedRoles={['lea', 'admin']}>
              <LEADashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Surveillance Center */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root Redirect */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/lea') : '/login'}
              replace
            />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
