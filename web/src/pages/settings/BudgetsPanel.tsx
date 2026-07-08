import { useEffect, useState } from 'react';
import type { BudgetDTO, CategoryDTO } from '@adel/shared';
import { useToast } from '../../state/ToastContext';
import { listBudgets, upsertBudget, deleteBudget } from '../../api/workspaceApi';
import { fmtShort } from '../../lib/format';
import { Modal } from '../../components/Modal';

export function BudgetsPanel({ workspaceId, categories }: { workspaceId: string; categories: CategoryDTO[] }) {
  const showToast = useToast();
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetDTO | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  function load() {
    listBudgets(workspaceId).then(setBudgets);
  }

  useEffect(load, [workspaceId]);

  function openAdd() {
    setEditing(null);
    setCategoryId(expenseCategories[0]?.id ?? '');
    setLimit('');
    setModalOpen(true);
  }

  function openEdit(b: BudgetDTO) {
    setEditing(b);
    setCategoryId(b.categoryId);
    setLimit(String(b.monthlyLimit));
    setModalOpen(true);
  }

  async function save() {
    if (!categoryId || !limit) return;
    await upsertBudget(workspaceId, categoryId, parseFloat(limit));
    setModalOpen(false);
    showToast(editing ? 'Бюджет обновлён' : 'Бюджет добавлен');
    load();
  }

  async function remove(categoryId: string) {
    if (!confirm('Удалить бюджет?')) return;
    await deleteBudget(workspaceId, categoryId);
    load();
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <div className="card-title">Бюджеты</div>
        <button className="card-action" onClick={openAdd}>
          + Добавить
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {budgets.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '6px 0' }}>Бюджеты не заданы</div>
        ) : (
          budgets.map((b) => {
            const category = categories.find((c) => c.id === b.categoryId);
            return (
              <div className="si" key={b.categoryId}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{category?.emoji}</div>
                <div className="si-info">
                  <div className="si-name">{category?.name}</div>
                  <div className="si-desc">
                    {fmtShort(b.spentThisMonth)} / {fmtShort(b.monthlyLimit)}
                  </div>
                </div>
                <div className="si-action">
                  <button onClick={() => openEdit(b)} style={{ color: 'var(--accent4)' }}>
                    <i className="ti ti-pencil" />
                  </button>
                  <button onClick={() => remove(b.categoryId)} style={{ color: 'var(--danger)' }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-title">{editing ? 'Редактировать бюджет' : 'Новый бюджет'}</div>
        <div className="fg">
          <label>Категория расхода</label>
          <select className="fi" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>Лимит в месяц (₸)</label>
          <input className="fi" type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0" />
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
