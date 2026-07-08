import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AnalyticsDTO, BudgetDTO, GoalDTO, TransactionDTO } from '@adel/shared';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { useCategories } from '../hooks/useCategories';
import {
  getAnalytics,
  listTransactions,
  listBudgets,
  listGoals,
  updateTransaction,
  deleteTransaction,
} from '../api/workspaceApi';
import { fmt, monthLabel } from '../lib/format';
import { TxItem } from '../components/TxItem';
import { Modal } from '../components/Modal';
import { NotifyCard } from '../components/NotifyCard';
import { TransactionForm, type TransactionFormValues } from '../components/TransactionForm';

export function Dashboard() {
  const { activeWorkspaceId } = useWorkspace();
  const { categories } = useCategories(activeWorkspaceId);
  const showToast = useToast();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsDTO | null>(null);
  const [recent, setRecent] = useState<TransactionDTO[]>([]);
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [goals, setGoals] = useState<GoalDTO[]>([]);
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

  const now = new Date();

  const load = useCallback(() => {
    if (!activeWorkspaceId) return;
    getAnalytics(activeWorkspaceId, 'month').then(setAnalytics);
    listTransactions(activeWorkspaceId, { pageSize: 5 }).then((r) => setRecent(r.items));
    listBudgets(activeWorkspaceId).then(setBudgets);
    listGoals(activeWorkspaceId).then(setGoals);
  }, [activeWorkspaceId]);

  useEffect(load, [load]);

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

  const net = analytics ? analytics.income - analytics.expense : 0;

  return (
    <div className="page">
      <div className="balance-hero">
        <div className="bh-label">Баланс семьи</div>
        <div className={`bh-amount ${net >= 0 ? 'inc' : 'exp'}`}>{fmt(net)}</div>
        <div className="bh-month">за {monthLabel(now.getMonth(), now.getFullYear()).toLowerCase()}</div>
        <div className="bh-row">
          <div className="bh-mini">
            <div className="bh-mini-lbl inc">
              <i className="ti ti-trending-up" />
              Доходы
            </div>
            <div className="bh-mini-val inc">{fmt(analytics?.income ?? 0)}</div>
          </div>
          <div className="bh-mini">
            <div className="bh-mini-lbl exp">
              <i className="ti ti-trending-down" />
              Расходы
            </div>
            <div className="bh-mini-val exp">{fmt(analytics?.expense ?? 0)}</div>
          </div>
        </div>
      </div>

      {recent.length > 0 && activeWorkspaceId && <NotifyCard workspaceId={activeWorkspaceId} />}

      {budgets.length > 0 && (
        <div>
          <div className="sec-hdr">
            <div className="sec-title">Бюджеты</div>
            <button className="sec-action" onClick={() => navigate('/settings')}>
              Все →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {budgets.slice(0, 3).map((b) => {
              const category = categories.find((c) => c.id === b.categoryId);
              const pct = Math.min(100, Math.round((b.spentThisMonth / b.monthlyLimit) * 100));
              const color = b.spentThisMonth > b.monthlyLimit ? '#ef4444' : pct > 75 ? '#f59e0b' : '#4ade80';
              return (
                <div className="budget-item" key={b.categoryId}>
                  <div className="budget-hdr">
                    <div className="budget-name">
                      {category?.emoji} {category?.name}
                    </div>
                    <div className="budget-vals">
                      {fmt(b.spentThisMonth)} / {fmt(b.monthlyLimit)}
                    </div>
                  </div>
                  <div className="budget-track">
                    <div className="budget-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="budget-status" style={{ color }}>
                    {b.spentThisMonth > b.monthlyLimit
                      ? '⚠ Превышен лимит!'
                      : pct > 75
                        ? `Осталось ${fmt(b.monthlyLimit - b.spentThisMonth)}`
                        : `${pct}% использовано`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="sec-hdr">
          <div className="sec-title">Последние операции</div>
          <button className="sec-action" onClick={() => navigate('/history')}>
            Все →
          </button>
        </div>
        <div className="tx-list">
          {recent.length === 0 ? (
            <div className="empty">
              <i className="ti ti-receipt" />
              Операций пока нет
              <br />
              <small>Нажмите + чтобы добавить</small>
            </div>
          ) : (
            recent.map((tx) => (
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
      </div>

      {goals.length > 0 && (
        <div>
          <div className="sec-hdr">
            <div className="sec-title">Цели</div>
            <button className="sec-action" onClick={() => navigate('/settings')}>
              Все →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
              return (
                <div className="goal-item" key={g.id}>
                  <div className="goal-hdr">
                    <div className="goal-name">{g.name}</div>
                    <div className="goal-pct">{pct}%</div>
                  </div>
                  <div className="goal-track">
                    <div className="goal-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="goal-vals">
                    <span>{fmt(g.savedAmount)}</span>
                    <span>{fmt(g.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
