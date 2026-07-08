import { useEffect, useState } from 'react';
import type { CategoryDTO, TxType } from '@adel/shared';

export interface TransactionFormValues {
  type: TxType;
  amount: string;
  categoryId: string;
  description: string;
  date: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyFormValues(categories: CategoryDTO[], type: TxType = 'EXPENSE'): TransactionFormValues {
  const first = categories.find((c) => c.type === type);
  return { type, amount: '', categoryId: first?.id ?? '', description: '', date: todayISO() };
}

export function TransactionForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  categories: CategoryDTO[];
  initial: TransactionFormValues;
  submitLabel: string;
  onSubmit: (values: TransactionFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);

  useEffect(() => setValues(initial), [initial]);

  const filteredCategories = categories.filter((c) => c.type === values.type);

  function setType(type: TxType) {
    const stillValid = categories.find((c) => c.id === values.categoryId && c.type === type);
    const fallback = categories.find((c) => c.type === type);
    setValues((v) => ({ ...v, type, categoryId: stillValid ? v.categoryId : fallback?.id ?? '' }));
  }

  return (
    <>
      <div className="type-toggle">
        <div
          className={`tt-btn ${values.type === 'EXPENSE' ? 'active-exp' : ''}`}
          onClick={() => setType('EXPENSE')}
        >
          Расход
        </div>
        <div className={`tt-btn ${values.type === 'INCOME' ? 'active-inc' : ''}`} onClick={() => setType('INCOME')}>
          Доход
        </div>
      </div>
      <div className="form-row">
        <div className="fg" style={{ flex: 1.1 }}>
          <label>Сумма (₸)</label>
          <input
            className="fi"
            type="number"
            value={values.amount}
            onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
            placeholder="0"
          />
        </div>
        <div className="fg" style={{ flex: 2 }}>
          <label>Категория</label>
          <select
            className="fi"
            value={values.categoryId}
            onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
          >
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="fg">
        <label>Описание</label>
        <input
          className="fi"
          type="text"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          placeholder="Краткое описание"
        />
      </div>
      <div className="fg">
        <label>Дата</label>
        <input
          className="fi"
          type="date"
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
        />
      </div>
      <button
        className={`sb ${values.type === 'EXPENSE' ? 'sb-exp' : 'sb-inc'}`}
        onClick={() => onSubmit(values)}
        disabled={!values.amount || !values.categoryId}
      >
        {submitLabel}
      </button>
      {onCancel && (
        <button className="sb sb-ghost" onClick={onCancel}>
          Отмена
        </button>
      )}
    </>
  );
}
