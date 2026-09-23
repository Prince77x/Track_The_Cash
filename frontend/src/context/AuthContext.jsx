import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // In-memory token storage (per security specification, no localStorage)
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start true to check session on mount
  const [error, setError] = useState(null);

  // 🚀 1. Define getAuthHeader first so other functions can safely use it
  const getAuthHeader = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // 🚀 2. Session recovery check on initial mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        // Session expired or not logged in
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Invalid credentials');
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser({
        username,
        role: data.role,
        full_name: data.full_name || username,
        public_user_id: data.public_user_id,
        email: data.email,
        expiresIn: data.expires_in,
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser({
        username: userData.username,
        role: data.role,
        full_name: data.full_name || userData.full_name,
        public_user_id: data.public_user_id,
        email: data.email || userData.email,
        expiresIn: data.expires_in,
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        getAuthHeader,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};