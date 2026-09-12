import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { authService } from '../services/authService';

const EMPTY = { name: '', email: '', password: '', role: 'CASHIER', isActive: true, canSeeCost: false, maxDiscountPercent: 10 };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => setRows(await authService.users.list()), []);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, maxDiscountPercent: Number(form.maxDiscountPercent) };
    if (form.id && !payload.password) delete payload.password;
    delete payload.id;
    try {
      if (form.id) await authService.users.update(form.id, payload);
      else await authService.users.create(payload);
      setForm(null); load(); setToast({ message: 'User saved', type: 'success' });
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <>
      <Header title="Users">
        <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={() => setForm({ ...EMPTY })}>Add user</button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Max discount</th><th className="th">Cost visible</th><th className="th">Status</th><th className="th" /></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.id} className="border-t border-slate-50 dark:border-slate-800/60">
                <td className="td font-semibold">{u.name}</td><td className="td">{u.email}</td><td className="td">{u.role}</td>
                <td className="td">{u.maxDiscountPercent}%</td><td className="td">{u.canSeeCost ? 'Yes' : 'No'}</td>
                <td className="td"><span className={`badge ${u.isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
                <td className="td text-right">
                  <button type="button" className="mr-2 text-sm font-semibold text-brand-600" onClick={() => setForm({ ...u, password: '' })}>Edit</button>
                  <button type="button" className="text-sm font-semibold text-rose-600" onClick={async () => { await authService.users.remove(u.id); load(); }}>Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <Modal open={!!form} title={form?.id ? 'Edit user' : 'Add user'} onClose={() => setForm(null)}
        footer={<div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button type="submit" form="user-form" className="btn-primary">Save</button></div>}>
        {form && (
          <form id="user-form" onSubmit={save} className="space-y-3">
            <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><label className="label">{form.id ? 'New password (optional)' : 'Password'}</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!form.id} minLength={8} /></div>
            <div><label className="label">Role</label><select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="CASHIER">Cashier</option><option value="ADMIN">Administrator</option></select></div>
            <div><label className="label">Maximum discount %</label><input type="number" min="0" max="100" className="input" value={form.maxDiscountPercent} onChange={(e) => setForm({ ...form, maxDiscountPercent: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.canSeeCost} onChange={(e) => setForm({ ...form, canSeeCost: e.target.checked })} /> May view cost & profit</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          </form>
        )}
      </Modal>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
