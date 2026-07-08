import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Role } from '@adel/shared';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'adel_active_workspace';

interface WorkspaceContextValue {
  activeWorkspaceId: string | null;
  activeRole: Role | null;
  setActiveWorkspaceId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspaces } = useAuth();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    if (workspaces.length === 0) return;
    const stillValid = workspaces.some((w) => w.id === activeWorkspaceId);
    if (!stillValid) {
      setActiveWorkspaceIdState(workspaces[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces]);

  function setActiveWorkspaceId(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveWorkspaceIdState(id);
  }

  const activeRole = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId)?.role ?? null,
    [workspaces, activeWorkspaceId]
  );

  return (
    <WorkspaceContext.Provider value={{ activeWorkspaceId, activeRole, setActiveWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
