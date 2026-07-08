import { useEffect, useState } from 'react';
import { getStats, type AdminStats } from '../api/adminApi';

export function Stats() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  return (
    <div>
      <div className="admin-h1">Статистика</div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-val">{stats?.userCount ?? '—'}</div>
          <div className="stat-lbl">Пользователей всего</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{stats?.workspaceCount ?? '—'}</div>
          <div className="stat-lbl">Пространств</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{stats?.transactionCount ?? '—'}</div>
          <div className="stat-lbl">Операций всего</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{stats?.last7dSignups ?? '—'}</div>
          <div className="stat-lbl">Регистраций за 7 дней</div>
        </div>
      </div>
    </div>
  );
}
