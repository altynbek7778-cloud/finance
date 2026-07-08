import { useEffect, useState } from 'react';
import type { InviteDTO } from '@adel/shared';
import { useToast } from '../../state/ToastContext';
import { createInvite, listInvites, revokeInvite } from '../../api/workspaceApi';

export function InvitePanel({ workspaceId }: { workspaceId: string }) {
  const showToast = useToast();
  const [invites, setInvites] = useState<InviteDTO[]>([]);

  function load() {
    listInvites(workspaceId).then(setInvites);
  }

  useEffect(load, [workspaceId]);

  async function handleCreate() {
    await createInvite(workspaceId);
    load();
  }

  async function handleRevoke(id: string) {
    await revokeInvite(workspaceId, id);
    load();
  }

  function inviteLink(code: string) {
    return `${window.location.origin}/invite/${code}`;
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(inviteLink(code));
    showToast('Ссылка скопирована');
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <div className="card-title">Приглашения</div>
        <button className="card-action" onClick={handleCreate}>
          + Создать ссылку
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {invites.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '6px 0' }}>Активных приглашений нет</div>
        ) : (
          invites.map((inv) => (
            <div className="si" key={inv.id}>
              <div className="si-info">
                <div className="si-name">Код: {inv.code.slice(0, 10)}…</div>
                <div className="si-desc">Истекает {new Date(inv.expiresAt).toLocaleDateString('ru-RU')}</div>
              </div>
              <div className="si-action">
                <button onClick={() => copyLink(inv.code)} style={{ color: 'var(--accent4)' }}>
                  <i className="ti ti-copy" />
                </button>
                <button onClick={() => handleRevoke(inv.id)} style={{ color: 'var(--danger)' }}>
                  <i className="ti ti-x" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
