import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useWorkspace } from '../state/WorkspaceContext';
import { createWorkspace, acceptInvite } from '../api/workspaceApi';
import { ApiError } from '../api/client';

export function Onboarding() {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [name, setName] = useState('Наша семья');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshMe } = useAuth();
  const { setActiveWorkspaceId } = useWorkspace();
  const navigate = useNavigate();

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const workspace = await createWorkspace(name.trim() || 'Наша семья');
      await refreshMe();
      setActiveWorkspaceId(workspace.id);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать пространство');
    } finally {
      setLoading(false);
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { workspaceId } = await acceptInvite(code.trim());
      await refreshMe();
      setActiveWorkspaceId(workspaceId);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Код приглашения не найден или истёк');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'choose') {
    return (
      <div className="auth-screen">
        <div className="auth-logo">💎</div>
        <div>
          <div className="auth-title">С чего начнём?</div>
          <div className="auth-sub">Создайте своё пространство или присоединитесь к семье</div>
        </div>
        <div className="choice-card" onClick={() => setMode('create')}>
          <div className="choice-icon">🏠</div>
          <div>
            <div className="choice-title">Создать пространство</div>
            <div className="choice-desc">Вы станете владельцем и сможете пригласить остальных</div>
          </div>
        </div>
        <div className="choice-card" onClick={() => setMode('join')}>
          <div className="choice-icon">🔗</div>
          <div>
            <div className="choice-title">Присоединиться по коду</div>
            <div className="choice-desc">Введите код приглашения от партнёра</div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="auth-screen">
        <div className="auth-title">Название пространства</div>
        <form className="auth-form" onSubmit={onCreate}>
          <div className="fg">
            <label>Например, «Наша семья»</label>
            <input className="fi" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="auth-error">{error}</div>
          <button className="sb sb-accent" type="submit" disabled={loading}>
            {loading ? 'Создаём…' : 'Создать'}
          </button>
          <button className="sb sb-ghost" type="button" onClick={() => setMode('choose')}>
            Назад
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-title">Код приглашения</div>
      <form className="auth-form" onSubmit={onJoin}>
        <div className="fg">
          <label>Вставьте код, который прислал партнёр</label>
          <input className="fi" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        </div>
        <div className="auth-error">{error}</div>
        <button className="sb sb-accent" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Присоединиться'}
        </button>
        <button className="sb sb-ghost" type="button" onClick={() => setMode('choose')}>
          Назад
        </button>
      </form>
    </div>
  );
}
