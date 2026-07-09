import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserDTO, WorkspaceSummaryDTO } from '@adel/shared';
import { api, setAccessToken, setRefreshToken, getRefreshToken, setSessionExpiredHandler } from '../api/client';

interface AuthContextValue {
  user: UserDTO | null;
  workspaces: WorkspaceSummaryDTO[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const data = await api.get<{ user: UserDTO; workspaces: WorkspaceSummaryDTO[] }>('/auth/me');
    setUser(data.user);
    setWorkspaces(data.workspaces);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setWorkspaces([]);
    });

    (async () => {
      try {
        if (getRefreshToken()) {
          const refreshed = await api.tryRefresh();
          if (refreshed) await loadMe();
        }
      } catch {
        // no valid session, stay logged out
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: UserDTO }>('/auth/login', {
        email,
        password,
      });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      await loadMe();
    },
    [loadMe]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: UserDTO }>('/auth/register', {
        email,
        password,
        name,
      });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      await loadMe();
    },
    [loadMe]
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setWorkspaces([]);
  }, []);

  const value = useMemo(
    () => ({ user, workspaces, loading, login, register, logout, refreshMe: loadMe }),
    [user, workspaces, loading, login, register, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
