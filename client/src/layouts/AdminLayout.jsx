import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
