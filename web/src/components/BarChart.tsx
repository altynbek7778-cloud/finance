import type { CategoryDTO } from '@adel/shared';
import { fmtShort } from '../lib/format';

const DEFAULT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#4ade80', '#06b6d4', '#7c6af7', '#a78bfa', '#ec4899'];

export function BarChart({
  data,
  categories,
  colors = DEFAULT_COLORS,
}: {
  data: Record<string, number>;
  categories: CategoryDTO[];
  colors?: string[];
}) {
  const items = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (items.length === 0) {
    return (
      <div className="empty" style={{ padding: '12px 0' }}>
        <i className="ti ti-chart-bar" />
        Нет данных
      </div>
    );
  }
  const max = items[0][1];
  return (
    <div className="bar-chart">
      {items.map(([categoryId, amount], i) => {
        const category = categories.find((c) => c.id === categoryId);
        return (
          <div className="bc-row" key={categoryId}>
            <div className="bc-lbl">
              {category?.emoji ?? '💰'} {category?.name ?? 'Прочее'}
            </div>
            <div className="bc-track">
              <div
                className="bc-fill"
                style={{ width: `${Math.round((amount / max) * 100)}%`, background: colors[i % colors.length] }}
              />
            </div>
            <div className="bc-val">{fmtShort(amount)}</div>
          </div>
        );
      })}
    </div>
  );
}
