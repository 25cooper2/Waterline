import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wl_token');
    if (token) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('wl_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('wl_token', data.token);
    // Fetch /me to populate boat info (login response only returns base user)
    try { const full = await api.me(); setUser(full); return full; }
    catch { setUser(data.user); return data.user; }
  };

  const register = async (email, password) => {
    const data = await api.register({ email, password });
    localStorage.setItem('wl_token', data.token);
    try { const full = await api.me(); setUser(full); return full; }
    catch { setUser(data.user); return data.user; }
  };

  const logout = () => {
    localStorage.removeItem('wl_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await api.me();
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
