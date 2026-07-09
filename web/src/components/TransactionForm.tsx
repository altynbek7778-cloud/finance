import { useEffect, useState } from 'react';
import type { CategoryDTO, TxType } from '@adel/shared';
import { fmt } from '../lib/format';

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

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function emptyFormValues(categories: CategoryDTO[], type: TxType = 'EXPENSE'): TransactionFormValues {
  const first = categories.find((c) => c.type === type);
  return { type, amount: '', categoryId: first?.id ?? '', description: '', date: todayISO() };
}

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];

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
  const [customDate, setCustomDate] = useState(false);

  useEffect(() => {
    setValues(initial);
    setCustomDate(initial.date !== todayISO() && initial.date !== yesterdayISO());
  }, [initial]);

  const filteredCategories = categories.filter((c) => c.type === values.type);

  function setType(type: TxType) {
    const stillValid = categories.find((c) => c.id === values.categoryId && c.type === type);
    const fallback = categories.find((c) => c.type === type);
    setValues((v) => ({ ...v, type, categoryId: stillValid ? v.categoryId : fallback?.id ?? '' }));
  }

  function pressKey(key: string) {
    setValues((v) => {
      if (key === '⌫') return { ...v, amount: v.amount.slice(0, -1) };
      const next = v.amount + key;
      if (next.length > 10) return v;
      return { ...v, amount: next.replace(/^0+(?=\d)/, '') };
    });
  }

  const amountNumber = Number(values.amount || 0);

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

      <div className={`amount-display ${values.type === 'EXPENSE' ? 'exp' : 'inc'}`}>
        {values.amount ? fmt(amountNumber) : '₸0'}
      </div>

      <div className="keypad">
        {KEYPAD_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={`keypad-key ${k === '⌫' ? 'keypad-key-del' : ''}`}
            onClick={() => pressKey(k)}
          >
            {k === '⌫' ? <i className="ti ti-backspace" /> : k}
          </button>
        ))}
      </div>

      <div className="fg">
        <label>Категория</label>
        <div className="category-grid">
          {filteredCategories.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`category-chip ${values.categoryId === c.id ? 'active' : ''}`}
              onClick={() => setValues((v) => ({ ...v, categoryId: c.id }))}
            >
              <span className="category-chip-emoji">{c.emoji}</span>
              <span className="category-chip-name">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="fg">
        <label>Описание (необязательно)</label>
        <input
          className="fi"
          type="text"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          placeholder="Например, «Магнум» или «Такси»"
        />
      </div>

      <div className="fg">
        <label>Дата</label>
        <div className="date-chips">
          <button
            type="button"
            className={`date-chip ${!customDate && values.date === todayISO() ? 'active' : ''}`}
            onClick={() => {
              setCustomDate(false);
              setValues((v) => ({ ...v, date: todayISO() }));
            }}
          >
            Сегодня
          </button>
          <button
            type="button"
            className={`date-chip ${!customDate && values.date === yesterdayISO() ? 'active' : ''}`}
            onClick={() => {
              setCustomDate(false);
              setValues((v) => ({ ...v, date: yesterdayISO() }));
            }}
          >
            Вчера
          </button>
          <button
            type="button"
            className={`date-chip ${customDate ? 'active' : ''}`}
            onClick={() => setCustomDate(true)}
          >
            Другая
          </button>
        </div>
        {customDate && (
          <input
            className="fi"
            style={{ marginTop: 8 }}
            type="date"
            value={values.date}
            onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
          />
        )}
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
