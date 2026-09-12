import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { POSProvider } from './context/POSContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Shifts from './pages/Shifts';
import Users from './pages/Users';
import Settings from './pages/Settings';

function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading POS...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/pos" replace />;
  return children;
}

function Routing() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/pos" replace /> : <Login />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route element={<Protected><AdminLayout /></Protected>}>
        <Route path="/pos" element={<POS />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/shifts" element={<Shifts />} />
        <Route path="/dashboard" element={<Protected adminOnly><Dashboard /></Protected>} />
        <Route path="/products" element={<Protected adminOnly><Products /></Protected>} />
        <Route path="/categories" element={<Protected adminOnly><Categories /></Protected>} />
        <Route path="/inventory" element={<Protected adminOnly><Inventory /></Protected>} />
        <Route path="/reports" element={<Protected adminOnly><Reports /></Protected>} />
        <Route path="/users" element={<Protected adminOnly><Users /></Protected>} />
        <Route path="/settings" element={<Protected adminOnly><Settings /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <POSProvider>
        <Routing />
      </POSProvider>
    </AuthProvider>
  );
}
