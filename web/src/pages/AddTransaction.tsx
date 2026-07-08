import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../state/WorkspaceContext';
import { useToast } from '../state/ToastContext';
import { useCategories } from '../hooks/useCategories';
import { createTransaction, parseTransactionText, type AiParseResult } from '../api/workspaceApi';
import { ApiError } from '../api/client';
import { fmt } from '../lib/format';
import { TransactionForm, emptyFormValues, type TransactionFormValues } from '../components/TransactionForm';

export function AddTransaction() {
  const { activeWorkspaceId } = useWorkspace();
  const { categories } = useCategories(activeWorkspaceId);
  const showToast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'ai' | 'manual'>('ai');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiParseResult | null>(null);
  const [aiError, setAiError] = useState('');
  const manualInitial = useMemo(() => emptyFormValues(categories), [categories]);

  async function submitManual(values: TransactionFormValues) {
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

  async function runAiParse() {
    if (!activeWorkspaceId || !aiText.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const result = await parseTransactionText(activeWorkspaceId, aiText.trim());
      setAiResult(result);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : 'Не удалось разобрать. Попробуйте вручную.');
    } finally {
      setAiLoading(false);
    }
  }

  async function confirmAi() {
    if (!activeWorkspaceId || !aiResult) return;
    await createTransaction(activeWorkspaceId, {
      type: aiResult.type,
      amount: aiResult.amount,
      categoryId: aiResult.categoryId,
      description: aiResult.desc,
    });
    setAiText('');
    setAiResult(null);
    showToast('Операция сохранена');
    navigate('/');
  }

  const aiCategory = aiResult ? categories.find((c) => c.id === aiResult.categoryId) : undefined;

  return (
    <div className="page">
      <div className="qa-card">
        <div className="qa-tabs">
          <button className={`qa-tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>
            <i className="ti ti-sparkles" style={{ fontSize: 13 }} /> ИИ-ввод
          </button>
          <button className={`qa-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>
            <i className="ti ti-pencil" style={{ fontSize: 13 }} /> Вручную
          </button>
        </div>

        {tab === 'ai' ? (
          <div className="qa-body">
            <div style={{ background: 'var(--bg4)', borderRadius: 'var(--r3)', padding: '8px 10px', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}>
              💬 Примеры: «потратил 4500 в магазине» · «зарплата 350000» · «такси домой 2000»
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <textarea
                className="ai-textarea"
                rows={2}
                placeholder="Напишите операцию своими словами..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
              />
              <button
                className="sb sb-accent"
                style={{ flexShrink: 0, padding: '9px 12px', fontSize: 12, minHeight: 42, width: 'auto' }}
                onClick={runAiParse}
                disabled={aiLoading || !aiText.trim()}
              >
                <i className={`ti ${aiLoading ? 'ti-loader spinning' : 'ti-sparkles'}`} />
              </button>
            </div>
            {aiError && <div className="auth-error">{aiError}</div>}
            {aiResult && (
              <div className="ai-result show">
                <div className="ai-row">
                  <span className="ai-row-lbl">Тип:</span>
                  <span className="ai-row-val" style={{ color: aiResult.type === 'EXPENSE' ? '#f87171' : '#4ade80' }}>
                    {aiResult.type === 'EXPENSE' ? 'Расход' : 'Доход'}
                  </span>
                </div>
                <div className="ai-row">
                  <span className="ai-row-lbl">Сумма:</span>
                  <span className="ai-row-val">{fmt(aiResult.amount)}</span>
                </div>
                <div className="ai-row">
                  <span className="ai-row-lbl">Категория:</span>
                  <span className="ai-row-val">
                    {aiCategory?.emoji} {aiCategory?.name}
                  </span>
                </div>
                <div className="ai-row">
                  <span className="ai-row-lbl">Описание:</span>
                  <span className="ai-row-val" style={{ color: 'var(--text2)' }}>{aiResult.desc}</span>
                </div>
                <div className="ai-actions">
                  <button className="ai-ok" onClick={confirmAi}>✓ Сохранить</button>
                  <button className="ai-cancel" onClick={() => setAiResult(null)}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="qa-body">
            <TransactionForm
              categories={categories}
              initial={manualInitial}
              submitLabel="Добавить"
              onSubmit={submitManual}
            />
          </div>
        )}
      </div>
    </div>
  );
}
