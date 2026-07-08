import { useEffect, useState } from 'react';
import type { AnalyticsDTO } from '@adel/shared';
import { useWorkspace } from '../state/WorkspaceContext';
import { useCategories } from '../hooks/useCategories';
import { getAnalytics } from '../api/workspaceApi';
import { fmtShort } from '../lib/format';
import { BarChart } from '../components/BarChart';

const INCOME_COLORS = ['#4ade80', '#06b6d4', '#7c6af7', '#f59e0b', '#a78bfa'];

export function Analytics() {
  const { activeWorkspaceId } = useWorkspace();
  const { categories } = useCategories(activeWorkspaceId);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [data, setData] = useState<AnalyticsDTO | null>(null);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    getAnalytics(activeWorkspaceId, period).then(setData);
  }, [activeWorkspaceId, period]);

  const savings = data ? data.income - data.expense : 0;
  const maxTrend = data ? Math.max(1, ...data.monthlyTrend.flatMap((m) => [m.income, m.expense])) : 1;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div className="period-tabs">
          {(['month', 'quarter', 'year'] as const).map((p) => (
            <button key={p} className={`pt ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
              {p === 'month' ? 'Месяц' : p === 'quarter' ? 'Квартал' : 'Год'}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="sc">
          <div className="sc-val inc">{fmtShort(data?.income ?? 0)}</div>
          <div className="sc-lbl">Доходы</div>
        </div>
        <div className="sc">
          <div className="sc-val exp">{fmtShort(data?.expense ?? 0)}</div>
          <div className="sc-lbl">Расходы</div>
        </div>
        <div className="sc">
          <div className="sc-val" style={{ color: savings >= 0 ? '#4ade80' : '#ef4444' }}>
            {savings >= 0 ? '+' : ''}
            {fmtShort(savings)}
          </div>
          <div className="sc-lbl">Остаток</div>
        </div>
        <div className="sc">
          <div
            className="sc-val"
            style={{
              color: (data?.savingsRate ?? 0) >= 20 ? '#4ade80' : (data?.savingsRate ?? 0) >= 10 ? '#f59e0b' : '#ef4444',
            }}
          >
            {data?.savingsRate ?? 0}%
          </div>
          <div className="sc-lbl">Сбережений</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Расходы по категориям</div>
        </div>
        <BarChart data={data?.expenseByCategory ?? {}} categories={categories} />
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Доходы по категориям</div>
        </div>
        <BarChart data={data?.incomeByCategory ?? {}} categories={categories} colors={INCOME_COLORS} />
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Динамика по месяцам</div>
        </div>
        <div className="month-bars">
          {(data?.monthlyTrend ?? []).map((m, i) => (
            <div className="mb-col" key={i}>
              <div className="mb-bars">
                <div
                  className="mb-bar"
                  style={{ height: Math.max(2, Math.round((m.income / maxTrend) * 50)), background: '#4ade80', opacity: m.income > 0 ? 1 : 0.15 }}
                />
                <div
                  className="mb-bar"
                  style={{ height: Math.max(2, Math.round((m.expense / maxTrend) * 50)), background: '#ef4444', opacity: m.expense > 0 ? 1 : 0.15 }}
                />
              </div>
              <div className="mb-lbl">{m.month}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: '#4ade80' }} />
            Доходы
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: '#ef4444' }} />
            Расходы
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-title">Вклад участников</div>
        </div>
        <div className="bar-chart">
          {(data?.byMember ?? []).map((m) => {
            const maxExp = Math.max(1, ...(data?.byMember ?? []).map((x) => x.expense));
            const maxInc = Math.max(1, ...(data?.byMember ?? []).map((x) => x.income));
            return (
              <div key={m.userId}>
                <div className="bc-row">
                  <div className="bc-lbl">{m.name}</div>
                  <div className="bc-track">
                    <div className="bc-fill" style={{ width: `${Math.round((m.expense / maxExp) * 100)}%`, background: '#a78bfa' }} />
                  </div>
                  <div className="bc-val">{fmtShort(m.expense)}</div>
                </div>
                <div className="bc-row">
                  <div className="bc-lbl">{m.name} (доход)</div>
                  <div className="bc-track">
                    <div className="bc-fill" style={{ width: `${Math.round((m.income / maxInc) * 100)}%`, background: '#4ade80' }} />
                  </div>
                  <div className="bc-val">{fmtShort(m.income)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
