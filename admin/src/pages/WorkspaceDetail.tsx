import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getWorkspace, deleteWorkspace, type AdminWorkspaceDetail } from '../api/adminApi';

export function WorkspaceDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<AdminWorkspaceDetail | null>(null);

  useEffect(() => {
    getWorkspace(id).then(setWorkspace);
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Удалить пространство «${workspace?.name}» безвозвратно?`)) return;
    await deleteWorkspace(id);
    navigate('/workspaces');
  }

  if (!workspace) return <div className="empty-state">Загрузка…</div>;

  return (
    <div>
      <Link to="/workspaces" className="back-link">
        <i className="ti ti-arrow-left" /> Ко всем пространствам
      </Link>
      <div className="admin-h1">{workspace.name}</div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val">{workspace.members.length}</div>
          <div className="stat-lbl">Участников</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{workspace.transactionCount}</div>
          <div className="stat-lbl">Операций</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ fontSize: 14 }}>
            {workspace.lastActivityAt ? new Date(workspace.lastActivityAt).toLocaleDateString('ru-RU') : '—'}
          </div>
          <div className="stat-lbl">Последняя активность</div>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Присоединился</th>
            </tr>
          </thead>
          <tbody>
            {workspace.members.map((m) => (
              <tr key={m.userId}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td>
                  <span className={`pill ${m.role === 'OWNER' ? 'pill-info' : 'pill-ok'}`}>{m.role}</span>
                </td>
                <td>{new Date(m.joinedAt).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-danger" onClick={handleDelete}>
        <i className="ti ti-trash" /> Удалить пространство безвозвратно
      </button>
    </div>
  );
}
