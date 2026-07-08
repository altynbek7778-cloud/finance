import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MemberDTO, TransactionDTO, TxType } from '@adel/shared';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { listTransactions, updateTransaction, deleteTransaction, getWorkspaceDetail } from '../api/workspaceApi';
import { monthLabel } from '../lib/format';
import { TxItem } from '../components/TxItem';
import { Modal } from '../components/Modal';
import { TransactionForm, type TransactionFormValues } from '../components/TransactionForm';

export function History() {
  const { activeWorkspaceId } = useWorkspace();
  const { categories } = useCategories(activeWorkspaceId);
  const showToast = useToast();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [type, setType] = useState<'all' | TxType>('all');
  const [categoryId, setCategoryId] = useState('all');
  const [userId, setUserId] = useState('all');
  const [items, setItems] = useState<TransactionDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [editingTx, setEditingTx] = useState<TransactionDTO | null>(null);

  const editInitial = useMemo(
    () =>
      editingTx && {
        type: editingTx.type,
        amount: String(editingTx.amount),
        categoryId: editingTx.categoryId,
        description: editingTx.description ?? '',
        date: editingTx.occurredAt.slice(0, 10),
      },
    [editingTx]
  );

  useEffect(() => {
    if (!activeWorkspaceId) return;
    getWorkspaceDetail(activeWorkspaceId).then((d) => setMembers(d.members));
  }, [activeWorkspaceId]);

  const load = useCallback(() => {
    if (!activeWorkspaceId) return;
    listTransactions(activeWorkspaceId, {
      month,
      year,
      type: type === 'all' ? undefined : type,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      userId: userId === 'all' ? undefined : userId,
      pageSize: 200,
    }).then((r) => setItems(r.items));
  }, [activeWorkspaceId, month, year, type, categoryId, userId]);

  useEffect(load, [load]);

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  async function handleDelete(txId: string) {
    if (!activeWorkspaceId) return;
    if (!confirm('Удалить операцию?')) return;
    await deleteTransaction(activeWorkspaceId, txId);
    showToast('Операция удалена');
    load();
  }

  async function handleSaveEdit(values: TransactionFormValues) {
    if (!activeWorkspaceId || !editingTx) return;
    await updateTransaction(activeWorkspaceId, editingTx.id, {
      type: values.type,
      amount: parseFloat(values.amount),
      categoryId: values.categoryId,
      description: values.description,
      occurredAt: new Date(values.date).toISOString(),
    });
    setEditingTx(null);
    showToast('Сохранено');
    load();
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <select className="fi" style={{ flex: 1, minWidth: 85 }} value={type} onChange={(e) => setType(e.target.value as 'all' | TxType)}>
          <option value="all">Все</option>
          <option value="EXPENSE">Расходы</option>
          <option value="INCOME">Доходы</option>
        </select>
        <select className="fi" style={{ flex: 1, minWidth: 110 }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="all">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
        <select className="fi" style={{ flex: 1, minWidth: 80 }} value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="all">Все</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="month-nav">
        <button className="mn-btn" onClick={() => changeMonth(-1)}>
          <i className="ti ti-chevron-left" />
        </button>
        <span className="mn-label">{monthLabel(month, year)}</span>
        <button className="mn-btn" onClick={() => changeMonth(1)}>
          <i className="ti ti-chevron-right" />
        </button>
      </div>

      <div className="tx-list">
        {items.length === 0 ? (
          <div className="empty">
            <i className="ti ti-receipt" />
            Нет операций за этот период
          </div>
        ) : (
          items.map((tx) => (
            <TxItem
              key={tx.id}
              tx={tx}
              category={categories.find((c) => c.id === tx.categoryId)}
              onEdit={() => setEditingTx(tx)}
              onDelete={() => handleDelete(tx.id)}
            />
          ))
        )}
      </div>

      <Modal open={!!editingTx} onClose={() => setEditingTx(null)}>
        <div className="modal-title">Редактировать операцию</div>
        {editingTx && editInitial && (
          <TransactionForm
            categories={categories}
            initial={editInitial}
            submitLabel="Сохранить"
            onSubmit={handleSaveEdit}
            onCancel={() => setEditingTx(null)}
          />
        )}
      </Modal>
    </div>
  );
}
