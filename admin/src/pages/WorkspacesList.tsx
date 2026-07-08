import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listWorkspaces, type AdminWorkspaceSummary } from '../api/adminApi';

export function WorkspacesList() {
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceSummary[]>([]);

  useEffect(() => {
    listWorkspaces().then(setWorkspaces);
  }, []);

  return (
    <div>
      <div className="admin-h1">Пространства ({workspaces.length})</div>
      <div className="table-card">
        {workspaces.length === 0 ? (
          <div className="empty-state">Пространств пока нет</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Участников</th>
                <th>Операций</th>
                <th>Создано</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((w) => (
                <tr key={w.id}>
                  <td>
                    <Link to={`/workspaces/${w.id}`} className="btn-link">
                      {w.name}
                    </Link>
                  </td>
                  <td>{w.memberCount}</td>
                  <td>{w.transactionCount}</td>
                  <td>{new Date(w.createdAt).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
