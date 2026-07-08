import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { exportWorkspace, removeMember } from '../api/workspaceApi';
import { MembersPanel } from './settings/MembersPanel';
import { InvitePanel } from './settings/InvitePanel';
import { BudgetsPanel } from './settings/BudgetsPanel';
import { GoalsPanel } from './settings/GoalsPanel';
import { CategoriesPanel } from './settings/CategoriesPanel';

export function Settings() {
  const { user, workspaces, logout } = useAuth();
  const { activeWorkspaceId, activeRole, setActiveWorkspaceId } = useWorkspace();
  const { categories, reload: reloadCategories } = useCategories(activeWorkspaceId);
  const showToast = useToast();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  async function handleExport() {
    if (!activeWorkspaceId) return;
    const data = await exportWorkspace(activeWorkspaceId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adel-finance-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLeave() {
    if (!activeWorkspaceId || !user) return;
    if (!confirm('Покинуть это пространство?')) return;
    await removeMember(activeWorkspaceId, user.id);
    showToast('Вы покинули пространство');
    window.location.href = '/';
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!activeWorkspaceId) return null;

  return (
    <div className="page">
      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Пространство</div>
          <button className="card-action" onClick={() => setSwitcherOpen((v) => !v)}>
            Сменить
          </button>
        </div>
        <div className="si">
          <div className="si-icon" style={{ background: '#7c6af722', color: '#a78bfa' }}>
            <i className="ti ti-home" />
          </div>
          <div className="si-info">
            <div className="si-name">{workspaces.find((w) => w.id === activeWorkspaceId)?.name}</div>
            <div className="si-desc">{activeRole === 'OWNER' ? 'Вы владелец' : 'Вы участник'}</div>
          </div>
        </div>
        {switcherOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {workspaces.map((w) => (
              <div
                key={w.id}
                className={`ws-sheet-item ${w.id === activeWorkspaceId ? 'active' : ''}`}
                onClick={() => {
                  setActiveWorkspaceId(w.id);
                  setSwitcherOpen(false);
                }}
              >
                <i className="ti ti-home" />
                <div style={{ flex: 1 }}>{w.name}</div>
                <span className={`badge ${w.role === 'OWNER' ? 'badge-owner' : 'badge-member'}`}>
                  {w.role === 'OWNER' ? 'Владелец' : 'Участник'}
                </span>
              </div>
            ))}
            <button className="sb sb-ghost" onClick={() => navigate('/onboarding')}>
              + Создать / присоединиться
            </button>
          </div>
        )}
      </div>

      <MembersPanel workspaceId={activeWorkspaceId} role={activeRole ?? 'MEMBER'} />
      {activeRole === 'OWNER' && <InvitePanel workspaceId={activeWorkspaceId} />}
      <BudgetsPanel workspaceId={activeWorkspaceId} categories={categories} />
      <GoalsPanel workspaceId={activeWorkspaceId} />
      <CategoriesPanel workspaceId={activeWorkspaceId} categories={categories} onChange={reloadCategories} />

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Аккаунт</div>
        </div>
        <div className="si">
          <div className="si-icon" style={{ background: `${user?.avatarColor}22`, color: user?.avatarColor ?? undefined }}>
            <i className="ti ti-user" />
          </div>
          <div className="si-info">
            <div className="si-name">{user?.name}</div>
            <div className="si-desc">{user?.email}</div>
          </div>
        </div>
        <button className="sb sb-ghost" style={{ marginTop: 10 }} onClick={handleLogout}>
          Выйти
        </button>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Установка приложения</div>
        </div>
        <div style={{ background: 'var(--bg4)', borderRadius: 'var(--r3)', padding: 10, fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
          <div style={{ color: 'var(--text)', fontWeight: 500, marginBottom: 5 }}>📲 Добавить на экран телефона</div>
          <div><b style={{ color: 'var(--accent)' }}>iPhone:</b> Safari → Поделиться → «На экран Домой»</div>
          <div><b style={{ color: 'var(--accent)' }}>Android:</b> Chrome → ⋮ → «Добавить на главный экран»</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Данные</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sb sb-ghost" style={{ flex: 1, fontSize: 11 }} onClick={handleExport}>
            <i className="ti ti-download" /> Экспорт JSON
          </button>
          <button className="sb sb-danger" style={{ flex: 1, fontSize: 11 }} onClick={handleLeave}>
            <i className="ti ti-door-exit" /> Покинуть пространство
          </button>
        </div>
      </div>
    </div>
  );
}
