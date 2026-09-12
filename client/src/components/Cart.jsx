import { useMoney, useAuth } from '../context/AuthContext';
import { usePOS } from '../context/POSContext';
import CartItem from './CartItem';

export default function Cart({ onPay, onHold, onRetrieve, onPrintLast, heldCount }) {
  const money = useMoney();
  const { settings } = useAuth();
  const {
    items,
    totals,
    clearCart,
    saleDiscount,
    setSaleDiscount,
    saleDiscountType,
    setSaleDiscountType,
  } = usePOS();

  return (
    <aside className="card flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Current sale
        </h2>
        <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-200">
          {totals.count} item{totals.count === 1 ? '' : 's'}
        </span>
      </header>

      <ul className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <li className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-400">
            <span className="text-3xl">▮▯▮</span>
            Scan a product to start a sale
          </li>
        ) : (
          items.map((item) => <CartItem key={item.productId} item={item} />)
        )}
      </ul>

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="mb-3 flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            className="input py-2 text-sm"
            placeholder="Sale discount"
            value={saleDiscount || ''}
            onChange={(e) => setSaleDiscount(Number(e.target.value) || 0)}
          />
          <select
            className="input w-28 py-2 text-sm"
            value={saleDiscountType}
            onChange={(e) => setSaleDiscountType(e.target.value)}
          >
            <option value="FIXED">Amount</option>
            <option value="PERCENT">Percent</option>
          </select>
        </div>

        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
            <dd>{money(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">Discount</dt>
            <dd className="text-rose-600">-{money(totals.discount)}</dd>
          </div>
          {settings?.taxEnabled && (
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Tax ({settings.taxRate}%)</dt>
              <dd>{money(totals.tax)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
            <dt className="text-base font-bold">Total</dt>
            <dd className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{money(totals.total)}</dd>
          </div>
        </dl>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={onHold} disabled={!items.length}>
            Hold (F6)
          </button>
          <button type="button" className="btn-ghost" onClick={onRetrieve}>
            Held ({heldCount}) F7
          </button>
          <button type="button" className="btn-ghost" onClick={clearCart} disabled={!items.length}>
            Clear (F5)
          </button>
          <button type="button" className="btn-ghost" onClick={onPrintLast}>
            Reprint (F8)
          </button>
        </div>

        <button type="button" className="btn-primary btn-lg mt-2 w-full" onClick={onPay} disabled={!items.length}>
          Payment · {money(totals.total)} (F4)
        </button>
      </div>
    </aside>
  );
}
