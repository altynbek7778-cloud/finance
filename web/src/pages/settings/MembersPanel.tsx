import { useEffect, useState } from 'react';
import type { MemberDTO } from '@adel/shared';
import { useAuth } from '../../state/AuthContext';
import { useToast } from '../../state/ToastContext';
import { getWorkspaceDetail, removeMember } from '../../api/workspaceApi';
import { ApiError } from '../../api/client';

export function MembersPanel({ workspaceId, role }: { workspaceId: string; role: 'OWNER' | 'MEMBER' }) {
  const { user } = useAuth();
  const showToast = useToast();
  const [members, setMembers] = useState<MemberDTO[]>([]);

  function load() {
    getWorkspaceDetail(workspaceId).then((d) => setMembers(d.members));
  }

  useEffect(load, [workspaceId]);

  async function handleRemove(memberUserId: string) {
    if (!confirm('Убрать участника из пространства?')) return;
    try {
      await removeMember(workspaceId, memberUserId);
      showToast('Участник удалён');
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Не удалось удалить участника');
    }
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <div className="card-title">Участники</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map((m) => (
          <div className="si" key={m.userId}>
            <div className="si-icon" style={{ background: `${m.displayColor}22`, color: m.displayColor ?? undefined }}>
              <i className="ti ti-user" />
            </div>
            <div className="si-info">
              <div className="si-name">{m.name}</div>
              <div className="si-desc">{m.role === 'OWNER' ? 'Владелец' : 'Участник'}</div>
            </div>
            {m.userId === user?.id ? (
              <span className="badge badge-owner">Вы</span>
            ) : (
              role === 'OWNER' && (
                <div className="si-action">
                  <button onClick={() => handleRemove(m.userId)} style={{ color: 'var(--danger)' }}>
                    <i className="ti ti-x" />
                  </button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
