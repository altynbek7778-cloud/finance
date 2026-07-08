import { useEffect, useState } from 'react';
import { listEvents, type AdminEvent } from '../api/adminApi';

const LEVEL_PILL: Record<string, string> = { INFO: 'pill-info', WARN: 'pill-warn', ERROR: 'pill-danger' };

export function EventLog() {
  const [events, setEvents] = useState<AdminEvent[]>([]);

  useEffect(() => {
    listEvents().then(setEvents);
  }, []);

  return (
    <div>
      <div className="admin-h1">Журнал событий</div>
      <div className="table-card">
        {events.length === 0 ? (
          <div className="empty-state">Событий пока нет</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Время</th>
                <th>Уровень</th>
                <th>Кто</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.createdAt).toLocaleString('ru-RU')}</td>
                  <td>
                    <span className={`pill ${LEVEL_PILL[e.level] ?? 'pill-info'}`}>{e.level}</span>
                  </td>
                  <td>{e.actorType}</td>
                  <td>{e.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
