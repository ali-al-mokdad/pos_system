import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import ReceiptPreview from '../components/ReceiptPreview';
import BarcodeScannerInput from '../components/BarcodeScannerInput';
import { settingsService } from '../services/reportService';
import { printerService } from '../services/printerService';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { setSettings } = useAuth();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);
  const [test, setTest] = useState(null);
  const [scanned, setScanned] = useState('');
  const [toast, setToast] = useState(null);
  const scanRef = useRef(null);

  useEffect(() => { settingsService.get().then(setForm).catch(() => {}); }, []);
  useEffect(() => { printerService.status().then(setStatus).catch(() => setStatus({ connected: false })); }, []);

  const field = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      businessName: form.businessName, address: form.address, phone: form.phone, email: form.email, whatsapp: form.whatsapp,
      currency: form.currency, taxEnabled: !!form.taxEnabled, taxRate: Number(form.taxRate), receiptFooter: form.receiptFooter,
      allowNegativeStock: !!form.allowNegativeStock, printerType: form.printerType, printerName: form.printerName,
      printerIp: form.printerIp, printerPort: Number(form.printerPort), paperWidth: Number(form.paperWidth),
    };
    try {
      const saved = await settingsService.update(payload);
      setForm(saved); setSettings(saved); setToast({ message: 'Settings saved', type: 'success' });
      setStatus(await printerService.status());
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const runTest = async () => {
    try {
      const res = await printerService.test();
      setTest(res);
      setToast({ message: res.ok ? 'Test receipt sent to the printer' : res.message, type: res.ok ? 'success' : 'error' });
    } catch (err) {
      setTest({ text: null });
      setToast({ message: err.message, type: 'error' });
    }
  };

  if (!form) return <><Header title="Settings" /><p className="p-4 text-sm text-slate-500">Loading...</p></>;

  return (
    <>
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={save} className="grid gap-4 lg:grid-cols-2">
          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-bold">Store</h2>
            {[['businessName', 'Business name'], ['address', 'Address'], ['phone', 'Phone'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['currency', 'Currency symbol'], ['receiptFooter', 'Receipt footer']].map(([k, l]) => (
              <div key={k}><label className="label">{l}</label><input className="input" value={form[k] || ''} onChange={(e) => field(k, e.target.value)} /></div>
            ))}
          </section>

          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-bold">Tax & stock</h2>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.taxEnabled} onChange={(e) => field('taxEnabled', e.target.checked)} /> Enable tax</label>
            <div><label className="label">Tax rate (%)</label><input type="number" step="0.01" min="0" max="100" className="input" value={form.taxRate} onChange={(e) => field('taxRate', e.target.value)} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.allowNegativeStock} onChange={(e) => field('allowNegativeStock', e.target.checked)} /> Allow selling below available stock</label>
          </section>

          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-bold">Hardware · Receipt printer</h2>
            <p className="text-sm">Status: <b className={status?.connected ? 'text-brand-600' : 'text-rose-600'}>{status?.connected ? 'Connected' : 'Disconnected'}</b> · {status?.type || 'ESC/POS'} · {status?.connection}</p>
            <div><label className="label">Connection type</label><select className="input" value={form.printerType} onChange={(e) => field('printerType', e.target.value)}>{['NETWORK', 'USB', 'SERIAL', 'NONE'].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="label">Printer name</label><input className="input" value={form.printerName || ''} onChange={(e) => field('printerName', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">IP address</label><input className="input" value={form.printerIp || ''} onChange={(e) => field('printerIp', e.target.value)} placeholder="192.168.1.100" /></div>
              <div><label className="label">Port</label><input type="number" className="input" value={form.printerPort} onChange={(e) => field('printerPort', e.target.value)} /></div>
            </div>
            <div><label className="label">Paper width</label><select className="input" value={form.paperWidth} onChange={(e) => field('paperWidth', e.target.value)}><option value={58}>58 mm</option><option value={80}>80 mm</option></select></div>
            <button type="button" className="btn-ghost" onClick={runTest}>Print test receipt</button>
            {test?.text && <ReceiptPreview text={test.text} paperWidth={Number(form.paperWidth)} note={test.ok ? 'Sent to the printer.' : test.message} />}
          </section>

          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-bold">Hardware · Barcode scanner</h2>
            <p className="text-sm text-brand-600">Scanner ready (USB HID keyboard mode)</p>
            <BarcodeScannerInput autoFocus={false} inputRef={scanRef} placeholder="Scan a barcode here..." onScan={setScanned} />
            {scanned && <p className="text-sm">Scanner detected: <span className="font-mono font-bold">{scanned}</span></p>}
          </section>

          <div className="lg:col-span-2"><button type="submit" className="btn-primary btn-lg">Save settings</button></div>
        </form>
      </div>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
