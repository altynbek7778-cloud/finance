import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './state/AuthContext';
import { WorkspaceProvider, useWorkspace } from './state/WorkspaceContext';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { InviteAccept } from './pages/InviteAccept';
import { Dashboard } from './pages/Dashboard';
import { AddTransaction } from './pages/AddTransaction';
import { Analytics } from './pages/Analytics';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="full-loading">Загрузка…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireWorkspace({ children }: { children: React.ReactNode }) {
  const { workspaces, loading } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  if (loading) return <div className="full-loading">Загрузка…</div>;
  if (workspaces.length === 0) return <Navigate to="/onboarding" replace />;
  if (!activeWorkspaceId) return <div className="full-loading">Загрузка…</div>;
  return <>{children}</>;
}

export function App() {
  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/:code" element={<InviteAccept />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <RequireWorkspace>
                <AppShell />
              </RequireWorkspace>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="add" element={<AddTransaction />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WorkspaceProvider>
  );
}
