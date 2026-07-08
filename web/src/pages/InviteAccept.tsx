import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useWorkspace } from '../state/WorkspaceContext';
import { previewInvite, acceptInvite } from '../api/workspaceApi';
import { ApiError } from '../api/client';

export function InviteAccept() {
  const { code = '' } = useParams();
  const { user, loading: authLoading, refreshMe } = useAuth();
  const { setActiveWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    previewInvite(code)
      .then((res) => setWorkspaceName(res.workspaceName))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Приглашение не найдено'));
  }, [code]);

  async function onJoin() {
    setJoining(true);
    setError('');
    try {
      const { workspaceId } = await acceptInvite(code);
      await refreshMe();
      setActiveWorkspaceId(workspaceId);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось присоединиться');
    } finally {
      setJoining(false);
    }
  }

  if (authLoading) return <div className="full-loading">Загрузка…</div>;

  return (
    <div className="auth-screen">
      <div className="auth-logo">💌</div>
      {error && !workspaceName ? (
        <div className="auth-title">{error}</div>
      ) : (
        <>
          <div className="auth-title">Приглашение в «{workspaceName ?? '…'}»</div>
          <div className="auth-sub">Присоединитесь, чтобы вести общий бюджет</div>
          {user ? (
            <div className="auth-form">
              <div className="auth-error">{error}</div>
              <button className="sb sb-accent" onClick={onJoin} disabled={joining}>
                {joining ? 'Присоединяемся…' : 'Присоединиться'}
              </button>
            </div>
          ) : (
            <div className="auth-form">
              <button className="sb sb-accent" onClick={() => navigate(`/login?invite=${code}`)}>
                Войти и присоединиться
              </button>
              <button className="sb sb-ghost" onClick={() => navigate(`/register?invite=${code}`)}>
                Создать аккаунт
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
