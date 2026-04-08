import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, MeResponse } from '../lib/api';

// ─── Theme cookie helpers (non-httponly, readable by React) ───────────────────
export function getThemeCookie(): 'light' | 'dark' {
  const match = document.cookie.match(/hh_theme=([^;]+)/);
  return (match?.[1] as 'light' | 'dark') ?? 'light';
}

export function setThemeCookie(theme: 'light' | 'dark') {
  document.cookie = `hh_theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthState {
  user: MeResponse | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isDonor: boolean;
  isStaff: boolean;
  theme: 'light' | 'dark';
  login: (token: string) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<MeResponse | null>(null);
  const [token, setToken]   = useState<string | null>(localStorage.getItem('hh_token'));
  const [loading, setLoading] = useState(true);
  const [theme, setTheme]   = useState<'light' | 'dark'>(getThemeCookie);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // On mount, verify existing token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.auth.me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('hh_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem('hh_token', newToken);
    setToken(newToken);
    const me = await api.auth.me();
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem('hh_token');
    localStorage.removeItem('hh_user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    const me = await api.auth.me();
    setUser(me);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    setThemeCookie(next);  // Writes browser-accessible cookie (not httponly)
  };

  const roles     = user?.roles ?? [];
  const isAdmin   = roles.includes('Admin');
  const isDonor   = roles.includes('Donor');
  const isStaff   = roles.includes('Staff') || isAdmin;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAdmin, isDonor, isStaff,
      theme, login, logout, toggleTheme, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
const loadingFallback: AuthState = {
  user: null, token: null, loading: true,
  isAdmin: false, isDonor: false, isStaff: false,
  theme: 'light',
  login: async () => {}, logout: () => {}, toggleTheme: () => {},
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    if (import.meta.env.DEV) return loadingFallback;
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
