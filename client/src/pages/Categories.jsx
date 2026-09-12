import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import { categoryService } from '../services/productService';
import Toast from '../components/Toast';

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => setRows(await categoryService.list(true)), []);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, description: form.description || null, displayOrder: Number(form.displayOrder) || 0, isActive: !!form.isActive };
      if (form.id) await categoryService.update(form.id, payload);
      else await categoryService.create(payload);
      setForm(null);
      load();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const move = async (index, dir) => {
    const next = [...rows];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setRows(next);
    await categoryService.reorder(next.map((c, i) => ({ id: c.id, displayOrder: i })));
  };

  const remove = async (c) => {
    try { await categoryService.remove(c.id); load(); }
    catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <>
      <Header title="Categories">
        <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={() => setForm({ name: '', description: '', displayOrder: rows.length, isActive: true })}>Add category</button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <button type="button" className="text-xs" onClick={() => move(i, -1)}>▲</button>
                <button type="button" className="text-xs" onClick={() => move(i, 1)}>▼</button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-slate-500">{c._count?.products ?? 0} products {c.isActive ? '' : '· hidden'}</p>
              </div>
              <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setForm({ ...c, description: c.description || '' })}>Edit</button>
              <button type="button" className="text-sm font-semibold text-rose-600" onClick={() => remove(c)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <Modal open={!!form} title={form?.id ? 'Edit category' : 'Add category'} onClose={() => setForm(null)}
        footer={<div className="flex justify-end gap-2"><button className="btn-ghost" type="button" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary" form="cat-form" type="submit">Save</button></div>}>
        {form && (
          <form id="cat-form" onSubmit={save} className="space-y-3">
            <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Visible</label>
          </form>
        )}
      </Modal>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
