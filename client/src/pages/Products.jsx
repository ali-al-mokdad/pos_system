import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductSearch from '../components/ProductSearch';
import Toast from '../components/Toast';
import { productService, categoryService } from '../services/productService';
import { useMoney } from '../context/AuthContext';

const UNITS = ['PIECE', 'KG', 'GRAM', 'LITER', 'BOTTLE', 'BOX', 'PACK'];
const EMPTY = {
  name: '', description: '', barcode: '', qrCode: '', sku: '', categoryId: '',
  sellingPrice: '', costPrice: '', stockQuantity: '', minimumStock: '', unit: 'PIECE', isActive: true,
};

export default function Products() {
  const money = useMoney();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scanRef = useRef(null);

  const load = useCallback(async () => {
    setRows(await productService.list({ search, active: 'all' }));
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { categoryService.list(true).then(setCategories).catch(() => {}); }, []);
  useEffect(() => { if (scanning) scanRef.current?.focus(); }, [scanning]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'id') return;
      if (form.id && k === 'stockQuantity') return; // stock changes via Inventory
      if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
    });
    if (file) fd.append('image', file);
    try {
      if (form.id) await productService.update(form.id, fd);
      else await productService.create(fd);
      setForm(null);
      setFile(null);
      setToast({ message: 'Product saved', type: 'success' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    await productService.remove(confirm.id);
    setConfirm(null);
    setToast({ message: 'Product removed', type: 'success' });
    load();
  };

  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Header title="Products">
        <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={() => { setForm({ ...EMPTY }); setFile(null); }}>
          Add product
        </button>
      </Header>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 max-w-md"><ProductSearch value={search} onChange={setSearch} placeholder="Search products" /></div>
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 dark:border-slate-800">
              <tr><th className="th">Product</th><th className="th">Barcode</th><th className="th">Category</th><th className="th">Cost</th><th className="th">Price</th><th className="th">Stock</th><th className="th">Status</th><th className="th" /></tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/60">
                  <td className="td font-semibold">{p.name}</td>
                  <td className="td font-mono text-xs">{p.barcode}</td>
                  <td className="td">{p.category?.name || '-'}</td>
                  <td className="td">{money(p.costPrice)}</td>
                  <td className="td">{money(p.sellingPrice)}</td>
                  <td className={`td ${p.stockQuantity <= p.minimumStock ? 'font-bold text-amber-600' : ''}`}>{p.stockQuantity} {p.unit.toLowerCase()}</td>
                  <td className="td">
                    <span className={`badge ${p.isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>{p.isActive ? 'Visible' : 'Hidden'}</span>
                  </td>
                  <td className="td text-right">
                    <button type="button" className="mr-2 text-sm font-semibold text-brand-600" onClick={() => { setForm({ ...EMPTY, ...p, categoryId: p.categoryId || '', description: p.description || '', sku: p.sku || '', qrCode: p.qrCode || '' }); setFile(null); }}>Edit</button>
                    <button type="button" className="text-sm font-semibold text-rose-600" onClick={() => setConfirm(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!form} title={form?.id ? 'Edit product' : 'Add product'} onClose={() => setForm(null)} width="max-w-2xl"
        footer={<div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button type="submit" form="product-form" className="btn-primary">Save</button></div>}>
        {form && (
          <form id="product-form" onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => field('name', e.target.value)} required /></div>
            <div className="col-span-2"><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => field('description', e.target.value)} /></div>
            <div>
              <label className="label">Barcode</label>
              <div className="flex gap-2">
                <input ref={scanRef} className="input font-mono" value={form.barcode} onChange={(e) => field('barcode', e.target.value)} required
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setScanning(false); } }} />
                <button type="button" className="btn-ghost whitespace-nowrap" onClick={() => { field('barcode', ''); setScanning(true); }}>
                  {scanning ? 'Waiting…' : 'Scan'}
                </button>
              </div>
            </div>
            <div><label className="label">QR value (optional)</label><input className="input font-mono" value={form.qrCode} onChange={(e) => field('qrCode', e.target.value)} /></div>
            <div><label className="label">SKU</label><input className="input" value={form.sku} onChange={(e) => field('sku', e.target.value)} /></div>
            <div><label className="label">Category</label>
              <select className="input" value={form.categoryId} onChange={(e) => field('categoryId', e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Selling price</label><input type="number" step="0.01" className="input" value={form.sellingPrice} onChange={(e) => field('sellingPrice', e.target.value)} required /></div>
            <div><label className="label">Cost price</label><input type="number" step="0.01" className="input" value={form.costPrice} onChange={(e) => field('costPrice', e.target.value)} /></div>
            {!form.id && <div><label className="label">Opening stock</label><input type="number" step="0.001" className="input" value={form.stockQuantity} onChange={(e) => field('stockQuantity', e.target.value)} /></div>}
            <div><label className="label">Minimum stock</label><input type="number" step="0.001" className="input" value={form.minimumStock} onChange={(e) => field('minimumStock', e.target.value)} /></div>
            <div><label className="label">Unit</label><select className="input" value={form.unit} onChange={(e) => field('unit', e.target.value)}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
            <div><label className="label">Image (JPG/PNG/WEBP, max 2MB)</label><input type="file" accept="image/*" className="input" onChange={(e) => setFile(e.target.files[0])} /></div>
            <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.isActive} onChange={(e) => field('isActive', e.target.checked)} /> Visible in POS</label>
            {error && <p className="col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          </form>
        )}
      </Modal>

      <ConfirmDialog open={!!confirm} message={`Delete ${confirm?.name}? Products with sales history are hidden instead.`} confirmLabel="Delete" onConfirm={remove} onCancel={() => setConfirm(null)} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
