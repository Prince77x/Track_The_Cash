import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { LeaView } from './pages/LeaView';
import { AdminView } from './pages/AdminView';
import { CitizenView } from './pages/CitizenView';
import { LandingPage } from './pages/LandingPage';

const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const hideNavbarOn = ['/', '/login', '/register'];
  const showNavbar = isAuthenticated && !hideNavbarOn.includes(location.pathname);

  return (
    <div>
      {showNavbar && <Navbar />}
      <main>{children}</main>
    </div>
  );
};

// Convenience redirect for /report
const ReportRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login?mode=report" replace />;
  if (role === 'admin' || role === 'user' || role === 'citizen') {
    return <Navigate to="/citizen?tab=report" replace />;
  }
  return <Navigate to="/lea" replace />;
};

// Convenience redirect for /track and /complaints
const TrackRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login?mode=track" replace />;
  if (role === 'admin' || role === 'user' || role === 'citizen') {
    return <Navigate to="/citizen?tab=complaints" replace />;
  }
  return <Navigate to="/lea" replace />;
};

// Convenience redirect for /dashboard
const DashboardRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'user' || role === 'citizen') return <Navigate to="/citizen" replace />;
  return <Navigate to="/lea" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            {/* Public Landing Page at root */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login initialRegister={true} />} />

            {/* Direct Citizen Convenience Routes */}
            <Route path="/report" element={<ReportRedirect />} />
            <Route path="/track" element={<TrackRedirect />} />
            <Route path="/complaints" element={<TrackRedirect />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Protected Role-Based Dashboards */}
            <Route
              path="/lea"
              element={
                <ProtectedRoute allowedRoles={['lea', 'admin']}>
                  <LeaView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen"
              element={
                <ProtectedRoute allowedRoles={['user', 'citizen', 'admin']}>
                  <CitizenView />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route returns to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
