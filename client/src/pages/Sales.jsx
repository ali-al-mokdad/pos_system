import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import ReceiptPreview from '../components/ReceiptPreview';
import Toast from '../components/Toast';
import { saleService } from '../services/saleService';
import { useAuth, useMoney } from '../context/AuthContext';

export default function Sales() {
  const money = useMoney();
  const { isAdmin, settings } = useAuth();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ period: 'today', from: '', to: '', search: '' });
  const [detail, setDetail] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [refundQty, setRefundQty] = useState({});
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setRows(await saleService.list(filters));
  }, [filters]);
  useEffect(() => { load(); }, [load]);

  const open = async (id) => {
    const sale = await saleService.get(id);
    setDetail(sale);
    setRefundQty({});
  };

  const reprint = async (id) => {
    const res = await saleService.reprint(id);
    setReceipt({ text: res.receiptText, note: res.print?.ok ? 'Sent to printer.' : res.print?.message });
  };

  const doRefund = async () => {
    const items = Object.entries(refundQty)
      .filter(([, q]) => Number(q) > 0)
      .map(([saleItemId, q]) => ({ saleItemId: Number(saleItemId), quantity: Number(q) }));
    if (!items.length) return setToast({ message: 'Select at least one item', type: 'error' });
    try {
      await saleService.refund(detail.id, { items, reason: 'Customer return' });
      setToast({ message: 'Refund recorded and stock restored', type: 'success' });
      await open(detail.id);
      load();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
    return undefined;
  };

  return (
    <>
      <Header title="Sales" />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="flex flex-wrap gap-2">
          <select className="input w-40" value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })}>
            <option value="">All</option><option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">This week</option><option value="month">This month</option>
          </select>
          <input type="date" className="input w-44" value={filters.from} onChange={(e) => setFilters({ ...filters, period: '', from: e.target.value })} />
          <input type="date" className="input w-44" value={filters.to} onChange={(e) => setFilters({ ...filters, period: '', to: e.target.value })} />
          <input className="input w-56" placeholder="Receipt number" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th">Receipt</th><th className="th">Date</th><th className="th">Cashier</th><th className="th">Items</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th" /></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="cursor-pointer border-t border-slate-50 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40" onClick={() => open(s.id)}>
                  <td className="td font-mono font-semibold">{s.receiptNumber}</td>
                  <td className="td">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="td">{s.user?.name}</td>
                  <td className="td">{s._count?.items}</td>
                  <td className="td font-bold">{money(s.total)}</td>
                  <td className="td">{s.paymentMethod}</td>
                  <td className="td"><span className={`badge ${s.status === 'COMPLETED' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span></td>
                  <td className="td text-right"><button type="button" className="text-sm font-semibold text-brand-600" onClick={(e) => { e.stopPropagation(); reprint(s.id); }}>Reprint</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!detail} title={`Receipt ${detail?.receiptNumber || ''}`} onClose={() => setDetail(null)} width="max-w-2xl"
        footer={<div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => reprint(detail.id)}>Reprint</button>
          {isAdmin && <button type="button" className="btn-danger" onClick={doRefund}>Refund selected</button>}
        </div>}>
        {detail && (
          <table className="w-full">
            <thead><tr><th className="th">Item</th><th className="th">Qty</th><th className="th">Price</th><th className="th">Total</th><th className="th">Refunded</th>{isAdmin && <th className="th">Return qty</th>}</tr></thead>
            <tbody>
              {detail.items.map((i) => (
                <tr key={i.id} className="border-t border-slate-50 dark:border-slate-800/60">
                  <td className="td">{i.productName}</td><td className="td">{i.quantity}</td><td className="td">{money(i.unitPrice)}</td><td className="td">{money(i.subtotal)}</td><td className="td">{i.refundedQty}</td>
                  {isAdmin && <td className="td"><input type="number" min="0" max={i.quantity - i.refundedQty} step="0.001" className="input py-1" value={refundQty[i.id] || ''} onChange={(e) => setRefundQty({ ...refundQty, [i.id]: e.target.value })} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <Modal open={!!receipt} title="Receipt" onClose={() => setReceipt(null)} width="max-w-xl">
        <ReceiptPreview text={receipt?.text} note={receipt?.note} paperWidth={settings?.paperWidth} />
      </Modal>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
