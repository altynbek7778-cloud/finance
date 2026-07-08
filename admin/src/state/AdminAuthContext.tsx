import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api, getToken, setToken } from '../api/client';

interface AdminAuthValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());

  async function login(username: string, password: string) {
    const { accessToken } = await api.post<{ accessToken: string }>('/admin/auth/login', { username, password });
    setToken(accessToken);
    setIsAuthenticated(true);
  }

  function logout() {
    api.post('/admin/auth/logout').catch(() => undefined);
    setToken(null);
    setIsAuthenticated(false);
  }

  return <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
