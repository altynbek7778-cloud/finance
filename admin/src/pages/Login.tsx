import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../state/AdminAuthContext';
import { ApiError } from '../api/client';

export function Login() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-title">💎 Админ-панель</div>
        <div className="fg">
          <label>Логин</label>
          <input className="fi" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="fg">
          <label>Пароль</label>
          <input className="fi" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="error-text">{error}</div>
        <button className="sb-accent" type="submit" disabled={loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
