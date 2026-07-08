import { Navigate, Route, Routes } from 'react-router-dom';
import { useAdminAuth } from './state/AdminAuthContext';
import { AdminShell } from './components/AdminShell';
import { Login } from './pages/Login';
import { Stats } from './pages/Stats';
import { WorkspacesList } from './pages/WorkspacesList';
import { WorkspaceDetail } from './pages/WorkspaceDetail';
import { UsersList } from './pages/UsersList';
import { EventLog } from './pages/EventLog';

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        }
      >
        <Route index element={<Stats />} />
        <Route path="workspaces" element={<WorkspacesList />} />
        <Route path="workspaces/:id" element={<WorkspaceDetail />} />
        <Route path="users" element={<UsersList />} />
        <Route path="events" element={<EventLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
