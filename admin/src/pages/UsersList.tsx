import { useEffect, useState } from 'react';
import { listUsers, disableUser, enableUser, deleteUser, type AdminUserSummary } from '../api/adminApi';

export function UsersList() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);

  function load() {
    listUsers().then(setUsers);
  }

  useEffect(load, []);

  async function toggleDisabled(u: AdminUserSummary) {
    if (u.isDisabled) await enableUser(u.id);
    else await disableUser(u.id);
    load();
  }

  async function remove(u: AdminUserSummary) {
    if (!confirm(`Удалить пользователя ${u.email} безвозвратно?`)) return;
    await deleteUser(u.id);
    load();
  }

  return (
    <div>
      <div className="admin-h1">Пользователи ({users.length})</div>
      <div className="table-card">
        {users.length === 0 ? (
          <div className="empty-state">Пользователей пока нет</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Пространства</th>
                <th>Статус</th>
                <th>Регистрация</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.workspaces.map((w) => w.name).join(', ') || '—'}</td>
                  <td>
                    <span className={`pill ${u.isDisabled ? 'pill-danger' : 'pill-ok'}`}>
                      {u.isDisabled ? 'Отключён' : 'Активен'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn" onClick={() => toggleDisabled(u)}>
                      {u.isDisabled ? 'Включить' : 'Отключить'}
                    </button>
                    <button className="btn btn-danger" onClick={() => remove(u)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
