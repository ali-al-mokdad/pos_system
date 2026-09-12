import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { useAuth, useMoney } from '../context/AuthContext';

const QUICK = [5, 10, 20, 50, 100];

export default function PaymentModal({ open, totals, onClose, onConfirm, busy }) {
  const money = useMoney();
  const { settings } = useAuth();
  const [method, setMethod] = useState('CASH');
  const [received, setReceived] = useState('');
  const [print, setPrint] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMethod('CASH');
      setReceived('');
      setError('');
    }
  }, [open]);

  const receivedNum = Number(received) || 0;
  const change = useMemo(() => Math.max(0, receivedNum - totals.total), [receivedNum, totals.total]);
  const insufficient = method === 'CASH' && receivedNum + 0.001 < totals.total;

  const confirm = async () => {
    setError('');
    if (insufficient) {
      setError('Amount received is less than the total.');
      return;
    }
    try {
      await onConfirm({ paymentMethod: method, amountReceived: method === 'CASH' ? receivedNum : totals.total, print });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal
      open={open}
      title="Payment"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={print} onChange={(e) => setPrint(e.target.checked)} />
            Print receipt
          </label>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary btn-lg" onClick={confirm} disabled={busy || insufficient}>
              {busy ? 'Processing...' : `Complete · ${money(totals.total)}`}
            </button>
          </div>
        </div>
      }
    >
      <dl className="mb-4 space-y-1 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{money(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Discount</dt>
          <dd className="text-rose-600">-{money(totals.discount)}</dd>
        </div>
        {settings?.taxEnabled && (
          <div className="flex justify-between">
            <dt>Tax ({settings.taxRate}%)</dt>
            <dd>{money(totals.tax)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold dark:border-slate-700">
          <dt>Grand total</dt>
          <dd>{money(totals.total)}</dd>
        </div>
      </dl>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {['CASH', 'CARD', 'OTHER'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`btn py-3 ${
              method === m ? 'bg-brand-600 text-white' : 'border border-slate-200 dark:border-slate-700'
            }`}
          >
            {m[0] + m.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {method === 'CASH' && (
        <div>
          <label className="label" htmlFor="received">
            Amount received
          </label>
          <input
            id="received"
            type="number"
            min="0"
            step="0.01"
            autoFocus
            className="input py-4 text-2xl font-bold"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setReceived(String(totals.total))}>
              Exact
            </button>
            {QUICK.map((q) => (
              <button key={q} type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setReceived(String(q))}>
                {money(q)}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-700/20">
            <span className="text-sm font-semibold">Change</span>
            <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-300">{money(change)}</span>
          </div>
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
    </Modal>
  );
}
