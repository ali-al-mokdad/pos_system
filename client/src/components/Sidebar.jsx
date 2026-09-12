import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/pos', label: 'POS', icon: '🧾', roles: ['ADMIN', 'CASHIER'] },
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN'] },
  { to: '/products', label: 'Products', icon: '📦', roles: ['ADMIN'] },
  { to: '/categories', label: 'Categories', icon: '🏷️', roles: ['ADMIN'] },
  { to: '/inventory', label: 'Inventory', icon: '📥', roles: ['ADMIN'] },
  { to: '/sales', label: 'Sales', icon: '💳', roles: ['ADMIN', 'CASHIER'] },
  { to: '/reports', label: 'Reports', icon: '📈', roles: ['ADMIN'] },
  { to: '/shifts', label: 'Shifts', icon: '🕒', roles: ['ADMIN', 'CASHIER'] },
  { to: '/users', label: 'Users', icon: '👥', roles: ['ADMIN'] },
  { to: '/settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user, settings } = useAuth();
  const links = LINKS.filter((l) => l.roles.includes(user?.role));

  return (
    <nav className="flex w-16 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-2 lg:w-56 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 hidden px-3 py-2 lg:block">
        <p className="truncate text-sm font-extrabold">{settings?.businessName || 'Market POS'}</p>
        <p className="text-xs text-slate-500">{user?.role}</p>
      </div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`
          }
        >
          <span className="text-lg">{l.icon}</span>
          <span className="hidden lg:inline">{l.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
