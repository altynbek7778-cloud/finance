import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../state/AdminAuthContext';

export function AdminShell() {
  const { logout } = useAdminAuth();

  return (
    <div className="admin-app">
      <div className="sidebar">
        <div className="sidebar-title">💎 Адель · Админ</div>
        <div className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <i className="ti ti-chart-bar" /> Статистика
          </NavLink>
          <NavLink to="/workspaces" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <i className="ti ti-home" /> Пространства
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <i className="ti ti-users" /> Пользователи
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <i className="ti ti-list-details" /> Журнал событий
          </NavLink>
        </div>
        <button className="sidebar-logout" onClick={logout}>
          <i className="ti ti-logout" /> Выйти
        </button>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
