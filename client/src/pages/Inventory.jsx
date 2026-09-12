import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { inventoryService } from '../services/inventoryService';
import { useMoney } from '../context/AuthContext';

const REASONS = ['New shipment', 'Damaged product', 'Expired product', 'Stock correction', 'Returned product'];

export default function Inventory() {
  const money = useMoney();
  const [data, setData] = useState(null);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setData(await inventoryService.overview());
    setMovements(await inventoryService.movements({ take: 50 }));
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.adjust({
        productId: form.productId,
        type: form.type,
        mode: form.mode,
        quantity: Number(form.quantity),
        reason: form.reason,
      });
      setForm(null);
      setToast({ message: 'Stock updated', type: 'success' });
      load();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <>
      <Header title="Inventory" />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {data && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[['Products', data.summary.totalProducts], ['Low stock', data.summary.lowStock], ['Out of stock', data.summary.outOfStock],
              ['Stock value (cost)', money(data.summary.stockValue)], ['Retail value', money(data.summary.retailValue)]].map(([l, v]) => (
              <div key={l} className="card p-4"><p className="text-xs uppercase text-slate-500">{l}</p><p className="mt-1 text-xl font-extrabold">{v}</p></div>
            ))}
          </div>
        )}

        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th">Product</th><th className="th">Stock</th><th className="th">Minimum</th><th className="th">Status</th><th className="th" /></tr></thead>
            <tbody>
              {data?.products.map((p) => {
                const out = p.stockQuantity <= 0;
                const low = !out && p.stockQuantity <= p.minimumStock;
                return (
                  <tr key={p.id} className="border-t border-slate-50 dark:border-slate-800/60">
                    <td className="td font-semibold">{p.name}</td>
                    <td className="td">{p.stockQuantity} {p.unit.toLowerCase()}</td>
                    <td className="td">{p.minimumStock}</td>
                    <td className="td"><span className={`badge ${out ? 'bg-rose-100 text-rose-700' : low ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>{out ? 'Out of stock' : low ? 'Low stock' : 'OK'}</span></td>
                    <td className="td text-right"><button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setForm({ productId: p.id, name: p.name, type: 'RESTOCK', mode: 'ADD', quantity: '', reason: REASONS[0] })}>Adjust</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <h2 className="px-4 pt-4 text-sm font-bold">Movement history</h2>
          <table className="w-full">
            <thead><tr><th className="th">Date</th><th className="th">Product</th><th className="th">Type</th><th className="th">Qty</th><th className="th">Before → After</th><th className="th">Reason</th><th className="th">User</th></tr></thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-t border-slate-50 dark:border-slate-800/60">
                  <td className="td">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="td">{m.product?.name}</td>
                  <td className="td"><span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{m.type}</span></td>
                  <td className="td">{m.quantity}</td>
                  <td className="td">{m.previousStock} → {m.newStock}</td>
                  <td className="td">{m.reason}</td>
                  <td className="td">{m.user?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!form} title={`Adjust stock · ${form?.name || ''}`} onClose={() => setForm(null)}
        footer={<div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button type="submit" form="adj" className="btn-primary">Apply</button></div>}>
        {form && (
          <form id="adj" onSubmit={submit} className="space-y-3">
            <div><label className="label">Action</label>
              <select className="input" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                <option value="ADD">Add stock</option><option value="REMOVE">Remove stock</option><option value="SET">Correct to exact value</option>
              </select></div>
            <div><label className="label">Movement type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['RESTOCK', 'ADJUSTMENT', 'DAMAGE', 'EXPIRY', 'RETURN'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="label">Quantity</label><input type="number" step="0.001" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
            <div><label className="label">Reason</label><input list="reasons" className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
              <datalist id="reasons">{REASONS.map((r) => <option key={r} value={r} />)}</datalist></div>
          </form>
        )}
      </Modal>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
