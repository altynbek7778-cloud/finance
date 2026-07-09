import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useWorkspace } from '../state/WorkspaceContext';
import { monthLabel, avatarColorFor } from '../lib/format';

export function AppShell() {
  const { user, workspaces } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const now = new Date();

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="app">
      <div className="header">
        <div>
          <div className="header-title">{activeWorkspace?.name ?? 'Адель'} 💎</div>
          <div className="header-sub">{monthLabel(now.getMonth(), now.getFullYear())}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <div className="user-badge" onClick={() => navigate('/settings')}>
            <div className="user-dot" style={{ background: user ? avatarColorFor(user.id) : '#888' }} />
            <div className="user-badge-name">{user?.name}</div>
          </div>
        </div>
      </div>

      <div className="content">
        <Outlet />
      </div>

      <div className="nav">
        <NavLink to="/" end className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
          <i className="ti ti-home" />
          <span>Главная</span>
        </NavLink>
        <NavLink to="/add" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
          <i className="ti ti-circle-plus" />
          <span>Добавить</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
          <i className="ti ti-chart-pie" />
          <span>Аналитика</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
          <i className="ti ti-list" />
          <span>История</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}>
          <i className="ti ti-settings" />
          <span>Настройки</span>
        </NavLink>
      </div>
    </div>
  );
}
