import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, children }) {
  const { user, logout, openShift } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('pos-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-lg font-extrabold">{title}</h1>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <span
          className={`badge ${
            openShift
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-200'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
          }`}
        >
          {openShift ? 'Shift open' : 'No open shift'}
        </span>
        <button type="button" className="btn-ghost px-3 py-2" onClick={() => setDark((v) => !v)} title="Toggle theme">
          {dark ? '☀️' : '🌙'}
        </button>
        <span className="hidden text-sm font-semibold sm:inline">{user?.name}</span>
        <button
          type="button"
          className="btn-ghost px-3 py-2 text-sm"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
