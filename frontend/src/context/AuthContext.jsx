import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getMe()
        .then(({ data }) => setUser(data.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithOneId = async () => {
    const { data } = await authApi.getOneIdUrl();
    window.location.href = data.data.url;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await authApi.logout(refreshToken).catch(() => {});
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const setTokens = (accessToken, refreshToken, userData) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const getToken = () => localStorage.getItem('accessToken');

  return (
    <AuthContext.Provider value={{ user, loading, loginWithOneId, logout, setTokens, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
