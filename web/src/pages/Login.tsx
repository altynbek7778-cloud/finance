import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useWorkspace } from '../state/WorkspaceContext';
import { acceptInvite } from '../api/workspaceApi';
import { ApiError } from '../api/client';

export function Login() {
  const { login, refreshMe } = useAuth();
  const { setActiveWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (inviteCode) {
        const { workspaceId } = await acceptInvite(inviteCode);
        await refreshMe();
        setActiveWorkspaceId(workspaceId);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">💎</div>
      <div>
        <div className="auth-title">Адель</div>
        <div className="auth-sub">Семейный бюджет</div>
      </div>
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="fg">
          <label>Email</label>
          <input
            className="fi"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="fg">
          <label>Пароль</label>
          <input
            className="fi"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="auth-error">{error}</div>
        <button className="sb sb-accent" type="submit" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
      <div className="auth-switch">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </div>
    </div>
  );
}
