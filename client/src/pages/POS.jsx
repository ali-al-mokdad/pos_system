import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import BarcodeScannerInput from '../components/BarcodeScannerInput';
import ProductSearch from '../components/ProductSearch';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import PaymentModal from '../components/PaymentModal';
import Modal from '../components/Modal';
import ReceiptPreview from '../components/ReceiptPreview';
import Toast from '../components/Toast';
import { productService, categoryService } from '../services/productService';
import { saleService, shiftService } from '../services/saleService';
import { useAuth } from '../context/AuthContext';
import { usePOS } from '../context/POSContext';

// Short beep for scan feedback (no asset file needed).
function beep(ok = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.06;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, ok ? 90 : 220);
  } catch (e) {
    /* audio unavailable */
  }
}

export default function POS() {
  const { openShift, setOpenShift, settings } = useAuth();
  const { items, addProduct, clearCart, totals, saleDiscount, saleDiscountType, restore } = usePOS();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [toast, setToast] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [held, setHeld] = useState([]);
  const [heldOpen, setHeldOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [lastSaleId, setLastSaleId] = useState(null);

  const scannerRef = useRef(null);
  const searchRef = useRef(null);
  const notify = (message, type = 'info') => setToast({ message, type });

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await productService.list({ search, categoryId, take: 60 }));
    } catch (e) {
      notify(e.message, 'error');
    }
  }, [search, categoryId]);

  const loadHeld = useCallback(async () => {
    try {
      setHeld(await saleService.held.list());
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => {});
    loadHeld();
  }, [loadHeld]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleScan = async (code) => {
    try {
      const product = await productService.byBarcode(code);
      const result = addProduct(product, 1);
      if (!result.ok) {
        beep(false);
        notify(result.message, 'error');
        return;
      }
      beep(true);
      notify(`${product.name} added`, 'success');
    } catch (e) {
      beep(false);
      if (e.status === 404) setNotFound(code);
      else notify(e.message, 'error');
    }
  };

  const pickProduct = (product) => {
    const result = addProduct(product, 1);
    if (!result.ok) return notify(result.message, 'error');
    beep(true);
    return notify(`${product.name} added`, 'success');
  };

  const completeSale = async ({ paymentMethod, amountReceived, print }) => {
    setBusy(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, discount: i.discount })),
        saleDiscount,
        saleDiscountType,
        paymentMethod,
        amountReceived,
        print,
      };
      const res = await saleService.create(payload);
      setLastSaleId(res.sale.id);
      clearCart();
      setPayOpen(false);
      setReceipt({ text: res.receiptText, note: res.print?.ok ? 'Sent to the thermal printer.' : `Printer: ${res.print?.message || 'not printed'}` });
      loadProducts();
      notify(`Sale ${res.sale.receiptNumber} completed`, 'success');
      setTimeout(() => scannerRef.current?.focus(), 50);
    } finally {
      setBusy(false);
    }
  };

  const holdSale = async () => {
    if (!items.length) return;
    await saleService.held.create(`${items.length} items`, { items, saleDiscount, saleDiscountType });
    clearCart();
    loadHeld();
    notify('Sale held', 'success');
  };

  const retrieveHeld = async (h) => {
    restore(h.payload);
    await saleService.held.remove(h.id);
    setHeldOpen(false);
    loadHeld();
  };

  const reprintLast = async () => {
    if (!lastSaleId) return notify('No recent sale to reprint', 'error');
    const res = await saleService.reprint(lastSaleId);
    return setReceipt({ text: res.receiptText, note: res.print?.ok ? 'Reprinted.' : res.print?.message });
  };

  // Keyboard shortcuts for fast cashier operation.
  useEffect(() => {
    const onKey = (e) => {
      const map = {
        F1: () => scannerRef.current?.focus(),
        F2: () => searchRef.current?.focus(),
        F4: () => items.length && setPayOpen(true),
        F5: () => clearCart(),
        F6: () => holdSale(),
        F7: () => setHeldOpen(true),
        F8: () => reprintLast(),
      };
      if (map[e.key]) {
        e.preventDefault();
        map[e.key]();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const startShift = async (e) => {
    e.preventDefault();
    const shift = await shiftService.open(Number(openingCash) || 0);
    setOpenShift(shift);
    setShiftOpen(false);
    notify('Shift opened', 'success');
  };

  return (
    <>
      <Header title="Point of Sale">
        {!openShift && (
          <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={() => setShiftOpen(true)}>
            Open shift
          </button>
        )}
      </Header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[1fr_400px]">
        <section className="flex min-h-0 flex-col gap-3">
          <BarcodeScannerInput onScan={handleScan} inputRef={scannerRef} />
          <ProductSearch value={search} onChange={setSearch} inputRef={searchRef} />
          <CategoryFilter categories={categories} value={categoryId} onChange={setCategoryId} />
          <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={pickProduct} />
            ))}
            {!products.length && <p className="col-span-full py-8 text-center text-sm text-slate-400">No products found.</p>}
          </div>
        </section>

        <div className="min-h-0">
          <Cart
            onPay={() => setPayOpen(true)}
            onHold={holdSale}
            onRetrieve={() => setHeldOpen(true)}
            onPrintLast={reprintLast}
            heldCount={held.length}
          />
        </div>
      </div>

      <PaymentModal open={payOpen} totals={totals} busy={busy} onClose={() => setPayOpen(false)} onConfirm={completeSale} />

      <Modal open={!!notFound} title="Product not found" onClose={() => setNotFound(null)} width="max-w-md">
        <p className="text-sm">
          No product matches barcode <span className="font-mono font-bold">{notFound}</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="btn-primary" href="/products">Add product</a>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setSearch(notFound);
              setNotFound(null);
            }}
          >
            Search product
          </button>
          <button type="button" className="btn-ghost" onClick={() => { setNotFound(null); scannerRef.current?.focus(); }}>
            Scan again
          </button>
        </div>
      </Modal>

      <Modal open={!!receipt} title="Receipt" onClose={() => setReceipt(null)} width="max-w-xl">
        <ReceiptPreview text={receipt?.text} note={receipt?.note} paperWidth={settings?.paperWidth} />
      </Modal>

      <Modal open={heldOpen} title="Held sales" onClose={() => setHeldOpen(false)}>
        {!held.length && <p className="text-sm text-slate-500">No held sales.</p>}
        <ul className="space-y-2">
          {held.map((h) => (
            <li key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold">{h.label || 'Held sale'}</p>
                <p className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString()}</p>
              </div>
              <button type="button" className="btn-primary px-3 py-1.5 text-sm" onClick={() => retrieveHeld(h)}>
                Restore
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={shiftOpen} title="Open shift" onClose={() => setShiftOpen(false)} width="max-w-sm">
        <form onSubmit={startShift}>
          <label className="label">Opening cash</label>
          <input type="number" step="0.01" min="0" autoFocus className="input" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
          <button type="submit" className="btn-primary mt-4 w-full">Start shift</button>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
