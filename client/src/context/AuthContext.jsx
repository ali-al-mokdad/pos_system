import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { getToken, setUnauthorizedHandler } from '../services/api';
import { settingsService } from '../services/reportService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [openShift, setOpenShift] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authService.me();
      setUser(data.user);
      setOpenShift(data.openShift);
      setSettings(await settingsService.get());
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const u = await authService.login(email, password);
    setUser(u);
    await refresh();
    return u;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setOpenShift(null);
  };

  const value = useMemo(
    () => ({
      user,
      settings,
      setSettings,
      openShift,
      setOpenShift,
      loading,
      login,
      logout,
      refresh,
      isAdmin: user?.role === 'ADMIN',
      currency: settings?.currency || '$',
    }),
    [user, settings, openShift, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useMoney() {
  const { currency } = useAuth();
  return (n) => `${currency}${Number(n || 0).toFixed(2)}`;
}
