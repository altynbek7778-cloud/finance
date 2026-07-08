import type { CategoryDTO, TransactionDTO } from '@adel/shared';
import { fmtShort, avatarColorFor } from '../lib/format';

export function TxItem({
  tx,
  category,
  onEdit,
  onDelete,
}: {
  tx: TransactionDTO;
  category: CategoryDTO | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sign = tx.type === 'EXPENSE' ? '-' : '+';
  const cls = tx.type === 'EXPENSE' ? 'exp' : 'inc';
  const dotColor = avatarColorFor(tx.userId);
  const d = new Date(tx.occurredAt);
  const dateLabel = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

  return (
    <div className="tx-item">
      <div className="tx-icon" style={{ background: tx.type === 'EXPENSE' ? '#ef444418' : '#4ade8018' }}>
        {category?.emoji ?? '💰'}
      </div>
      <div className="tx-info">
        <div className="tx-name">{tx.description || category?.name || 'Операция'}</div>
        <div className="tx-meta">
          <div className="tx-udot" style={{ background: dotColor }} />
          <span>{tx.userName}</span>
          <span>· {category?.name ?? 'Прочее'}</span>
          <span>· {dateLabel}</span>
        </div>
      </div>
      <div className={`tx-amt ${cls}`}>
        {sign}
        {fmtShort(tx.amount)}
      </div>
      <div className="tx-swipe-actions">
        <button className="tx-edit-btn" onClick={onEdit}>
          <i className="ti ti-pencil" />
        </button>
        <button className="tx-del-btn" onClick={onDelete}>
          <i className="ti ti-trash" />
        </button>
      </div>
    </div>
  );
}
