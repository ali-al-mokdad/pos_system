import { useState } from 'react';
import { useMoney } from '../context/AuthContext';
import { usePOS } from '../context/POSContext';

export default function CartItem({ item }) {
  const money = useMoney();
  const { setQuantity, setItemDiscount, removeItem } = usePOS();
  const [showDiscount, setShowDiscount] = useState(item.discount > 0);
  const lineTotal = item.unitPrice * item.quantity - item.discount;

  return (
    <li className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {money(item.unitPrice)} / {item.unit.toLowerCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{money(lineTotal)}</p>
          {item.discount > 0 && <p className="text-xs text-rose-500">-{money(item.discount)}</p>}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            className="px-3 py-1.5 text-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setQuantity(item.productId, item.quantity - 1)}
          >
            −
          </button>
          <input
            className="w-16 border-x border-slate-200 bg-transparent py-1.5 text-center text-sm font-semibold outline-none dark:border-slate-700"
            value={item.quantity}
            onChange={(e) => setQuantity(item.productId, Number(e.target.value) || 0)}
          />
          <button
            type="button"
            className="px-3 py-1.5 text-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setQuantity(item.productId, item.quantity + 1)}
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowDiscount((v) => !v)}
          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Discount
        </button>

        <button
          type="button"
          onClick={() => removeItem(item.productId)}
          className="ml-auto rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          Remove
        </button>
      </div>

      {showDiscount && (
        <input
          type="number"
          min="0"
          step="0.01"
          className="input mt-2 py-1.5 text-sm"
          placeholder="Item discount amount"
          value={item.discount || ''}
          onChange={(e) => setItemDiscount(item.productId, Number(e.target.value) || 0)}
        />
      )}
    </li>
  );
}
