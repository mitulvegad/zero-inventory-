import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Create default axios instance pointing to the Express backend
let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Self-healing: automatically append /api if omitted in environment variables
if (backendUrl && !backendUrl.endsWith('/api') && !backendUrl.endsWith('/api/')) {
  backendUrl = backendUrl.endsWith('/') ? `${backendUrl}api` : `${backendUrl}/api`;
}

export const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set the authorization header globally whenever token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['x-auth-token'] = token;
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['x-auth-token'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, saas_code) => {
    try {
      const res = await api.post('/auth/login', { email, password, saas_code });
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message: errorMsg };
    }
  };

  const register = async (email, password, plan_name) => {
    try {
      const res = await api.post('/auth/register', { email, password, plan_name });
      return {
        success: true,
        saas_code: res.data.saas_code,
        token: res.data.token,
        plan_name: res.data.plan_name,
        email: res.data.email
      };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed.';
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setToken, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
