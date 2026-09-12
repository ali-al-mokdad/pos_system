import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const { refresh, user } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await authService.changePassword(current, next);
      await refresh();
      navigate(user.role === 'ADMIN' ? '/dashboard' : '/pos', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-extrabold">Change your password</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          The default password must be changed before using the POS.
        </p>
        <label className="label">Current password</label>
        <input type="password" className="input mb-3" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <label className="label">New password (min 8 characters)</label>
        <input type="password" className="input" value={next} onChange={(e) => setNext(e.target.value)} required />
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button type="submit" className="btn-primary mt-5 w-full">Update password</button>
      </form>
    </div>
  );
}
