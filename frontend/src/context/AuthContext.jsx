import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(USER_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const setToken = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      if (newUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setUser(newUser);
      }
      setTokenState(newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    const data = await r.json();
    setToken(data.token, data.user);
    return data.user;
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setLoading(false);
      return;
    }
    try {
      const r = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (r.ok) {
        const u = await r.json();
        setUser(u);
        setTokenState(t);
      } else {
        setToken(null);
      }
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onLogout = () => setToken(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [setToken]);

  const value = {
    token,
    user,
    loading,
    login,
    logout,
    setToken,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
