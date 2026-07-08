import { useEffect, useState } from 'react';
import type { GoalDTO } from '@adel/shared';
import { useToast } from '../../state/ToastContext';
import { listGoals, createGoal, updateGoal, deleteGoal } from '../../api/workspaceApi';
import { fmt } from '../../lib/format';
import { Modal } from '../../components/Modal';

export function GoalsPanel({ workspaceId }: { workspaceId: string }) {
  const showToast = useToast();
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GoalDTO | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');

  function load() {
    listGoals(workspaceId).then(setGoals);
  }

  useEffect(load, [workspaceId]);

  function openAdd() {
    setEditing(null);
    setName('');
    setTarget('');
    setSaved('');
    setModalOpen(true);
  }

  function openEdit(g: GoalDTO) {
    setEditing(g);
    setName(g.name);
    setTarget(String(g.targetAmount));
    setSaved(String(g.savedAmount));
    setModalOpen(true);
  }

  async function save() {
    if (!name.trim() || !target) return;
    const payload = { name: name.trim(), targetAmount: parseFloat(target), savedAmount: parseFloat(saved) || 0 };
    if (editing) {
      await updateGoal(workspaceId, editing.id, payload);
      showToast('Цель обновлена');
    } else {
      await createGoal(workspaceId, payload);
      showToast('Цель добавлена');
    }
    setModalOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Удалить цель?')) return;
    await deleteGoal(workspaceId, id);
    load();
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <div className="card-title">Финансовые цели</div>
        <button className="card-action" onClick={openAdd}>
          + Добавить
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {goals.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '6px 0' }}>Целей нет</div>
        ) : (
          goals.map((g) => {
            const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
            return (
              <div className="si" key={g.id}>
                <div className="si-info">
                  <div className="si-name">{g.name}</div>
                  <div className="si-desc">
                    {pct}% · {fmt(g.savedAmount)} из {fmt(g.targetAmount)}
                  </div>
                </div>
                <div className="si-action">
                  <button onClick={() => openEdit(g)} style={{ color: 'var(--accent4)' }}>
                    <i className="ti ti-pencil" />
                  </button>
                  <button onClick={() => remove(g.id)} style={{ color: 'var(--danger)' }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-title">{editing ? 'Редактировать цель' : 'Новая цель'}</div>
        <div className="fg">
          <label>Название</label>
          <input className="fi" value={name} onChange={(e) => setName(e.target.value)} placeholder="Отпуск, авто, ремонт..." />
        </div>
        <div className="form-row">
          <div className="fg">
            <label>Цель (₸)</label>
            <input className="fi" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
          </div>
          <div className="fg">
            <label>Накоплено (₸)</label>
            <input className="fi" type="number" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" />
          </div>
        </div>
        <button className="sb sb-accent" onClick={save}>
          Сохранить
        </button>
        <button className="sb sb-ghost" onClick={() => setModalOpen(false)}>
          Отмена
        </button>
      </Modal>
    </div>
  );
}
