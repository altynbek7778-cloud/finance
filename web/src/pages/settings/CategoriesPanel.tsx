import { useState } from 'react';
import type { CategoryDTO, TxType } from '@adel/shared';
import { useToast } from '../../state/ToastContext';
import { createCategory, updateCategory, deleteCategory } from '../../api/workspaceApi';
import { Modal } from '../../components/Modal';
import { ApiError } from '../../api/client';

export function CategoriesPanel({
  workspaceId,
  categories,
  onChange,
}: {
  workspaceId: string;
  categories: CategoryDTO[];
  onChange: () => void;
}) {
  const showToast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💰');
  const [type, setType] = useState<TxType>('EXPENSE');

  function openAdd() {
    setEditing(null);
    setName('');
    setEmoji('💰');
    setType('EXPENSE');
    setModalOpen(true);
  }

  function openEdit(c: CategoryDTO) {
    setEditing(c);
    setName(c.name);
    setEmoji(c.emoji);
    setType(c.type);
    setModalOpen(true);
  }

  async function save() {
    if (!name.trim()) return;
    if (editing) {
      await updateCategory(workspaceId, editing.id, { name: name.trim(), emoji, type });
      showToast('Категория обновлена');
    } else {
      await createCategory(workspaceId, { name: name.trim(), emoji, type });
      showToast('Категория добавлена');
    }
    setModalOpen(false);
    onChange();
  }

  async function remove(id: string) {
    if (categories.length <= 2) {
      alert('Нужна хотя бы одна категория');
      return;
    }
    if (!confirm('Удалить категорию?')) return;
    try {
      await deleteCategory(workspaceId, id);
      onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Не удалось удалить категорию');
    }
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <div className="card-title">Категории</div>
        <button className="card-action" onClick={openAdd}>
          + Добавить
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {categories.map((c) => (
          <div className="cat-item" key={c.id}>
            <div className="cat-emoji">{c.emoji}</div>
            <div className="cat-name">{c.name}</div>
            <div className={`cat-type-badge ${c.type === 'EXPENSE' ? 'ctb-exp' : 'ctb-inc'}`}>
              {c.type === 'EXPENSE' ? 'Расход' : 'Доход'}
            </div>
            <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', color: 'var(--accent4)', cursor: 'pointer', fontSize: 14, display: 'flex', marginLeft: 'auto' }}>
              <i className="ti ti-pencil" />
            </button>
            <button onClick={() => remove(c.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14, display: 'flex' }}>
              <i className="ti ti-x" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-title">{editing ? 'Редактировать категорию' : 'Новая категория'}</div>
        <div className="form-row">
          <div className="fg" style={{ flex: 0.5 }}>
            <label>Эмодзи</label>
            <input className="fi" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2} />
          </div>
          <div className="fg" style={{ flex: 2 }}>
            <label>Название</label>
            <input className="fi" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="fg">
          <label>Тип</label>
          <select className="fi" value={type} onChange={(e) => setType(e.target.value as TxType)}>
            <option value="EXPENSE">Расход</option>
            <option value="INCOME">Доход</option>
          </select>
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
