import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/dashboard' : '/pos', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <h1 className="text-2xl font-extrabold">Market POS</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Sign in to open the register</p>

        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input mb-3" value={email} autoFocus onChange={(e) => setEmail(e.target.value)} required />

        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}

        <button type="submit" className="btn-primary btn-lg mt-5 w-full" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">
          Requires a connection to the local POS server.
        </p>
      </form>
    </div>
  );
}
