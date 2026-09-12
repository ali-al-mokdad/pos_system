import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { shiftService } from '../services/saleService';
import { useAuth, useMoney } from '../context/AuthContext';

export default function Shifts() {
  const money = useMoney();
  const { openShift, setOpenShift } = useAuth();
  const [rows, setRows] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [closeForm, setCloseForm] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => setRows(await shiftService.list()), []);
  useEffect(() => { load(); }, [load]);

  const doOpen = async (e) => {
    e.preventDefault();
    try {
      const shift = await shiftService.open(Number(e.target.cash.value) || 0);
      setOpenShift(shift); setOpenForm(false); load();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const startClose = async (shift) => {
    const detail = await shiftService.get(shift.id);
    setCloseForm({ ...detail, actualCash: '' });
  };

  const doClose = async (e) => {
    e.preventDefault();
    try {
      await shiftService.close(closeForm.id, Number(closeForm.actualCash) || 0, closeForm.note);
      setCloseForm(null); setOpenShift(null); load();
      setToast({ message: 'Shift closed', type: 'success' });
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <>
      <Header title="Shifts">
        {!openShift && <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={() => setOpenForm(true)}>Open shift</button>}
      </Header>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th">Cashier</th><th className="th">Opened</th><th className="th">Closed</th><th className="th">Opening</th><th className="th">Expected</th><th className="th">Actual</th><th className="th">Difference</th><th className="th" /></tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.id} className="border-t border-slate-50 dark:border-slate-800/60">
                <td className="td">{s.user?.name}</td><td className="td">{new Date(s.openedAt).toLocaleString()}</td>
                <td className="td">{s.closedAt ? new Date(s.closedAt).toLocaleString() : '—'}</td>
                <td className="td">{money(s.openingCash)}</td><td className="td">{s.expectedCash != null ? money(s.expectedCash) : '—'}</td>
                <td className="td">{s.closingCash != null ? money(s.closingCash) : '—'}</td>
                <td className={`td font-semibold ${s.difference < 0 ? 'text-rose-600' : s.difference > 0 ? 'text-amber-600' : ''}`}>{s.difference != null ? money(s.difference) : '—'}</td>
                <td className="td text-right">{s.status === 'OPEN' && <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => startClose(s)}>Close</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <Modal open={openForm} title="Open shift" onClose={() => setOpenForm(false)} width="max-w-sm">
        <form onSubmit={doOpen}><label className="label">Opening cash</label><input name="cash" type="number" step="0.01" className="input" autoFocus /><button className="btn-primary mt-4 w-full" type="submit">Start shift</button></form>
      </Modal>

      <Modal open={!!closeForm} title="Close shift" onClose={() => setCloseForm(null)} width="max-w-sm">
        {closeForm && (
          <form onSubmit={doClose} className="space-y-2 text-sm">
            <p>Opening cash: <b>{money(closeForm.openingCash)}</b></p>
            <p>Cash sales: <b>{money(closeForm.cashSales)}</b></p>
            <p>Expected cash: <b>{money(closeForm.expected)}</b></p>
            <label className="label mt-3">Actual counted cash</label>
            <input type="number" step="0.01" className="input" autoFocus value={closeForm.actualCash} onChange={(e) => setCloseForm({ ...closeForm, actualCash: e.target.value })} required />
            <p className="pt-1">Difference: <b>{money((Number(closeForm.actualCash) || 0) - closeForm.expected)}</b></p>
            <label className="label mt-2">Note</label>
            <input className="input" value={closeForm.note || ''} onChange={(e) => setCloseForm({ ...closeForm, note: e.target.value })} />
            <button className="btn-primary mt-4 w-full" type="submit">Close shift</button>
          </form>
        )}
      </Modal>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
