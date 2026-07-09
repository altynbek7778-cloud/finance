import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { createTransaction } from '../api/workspaceApi';
import { TransactionForm, emptyFormValues, type TransactionFormValues } from '../components/TransactionForm';

export function AddTransaction() {
  const { activeWorkspaceId } = useWorkspace();
  const { categories } = useCategories(activeWorkspaceId);
  const showToast = useToast();
  const navigate = useNavigate();
  const initial = useMemo(() => emptyFormValues(categories), [categories]);

  async function submit(values: TransactionFormValues) {
    if (!activeWorkspaceId) return;
    await createTransaction(activeWorkspaceId, {
      type: values.type,
      amount: parseFloat(values.amount),
      categoryId: values.categoryId,
      description: values.description,
      occurredAt: new Date(values.date).toISOString(),
    });
    showToast('Операция добавлена');
    navigate('/');
  }

  return (
    <div className="page">
      <div className="qa-card">
        <div className="qa-body">
          <TransactionForm categories={categories} initial={initial} submitLabel="Добавить" onSubmit={submit} />
        </div>
      </div>
    </div>
  );
}
