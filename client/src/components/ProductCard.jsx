import { useMoney } from '../context/AuthContext';

export default function ProductCard({ product, onSelect }) {
  const money = useMoney();
  const out = product.stockQuantity <= 0;
  const low = !out && product.stockQuantity <= product.minimumStock;

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="card flex flex-col overflow-hidden p-0 text-left transition hover:border-brand-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400"
    >
      <div className="flex h-24 items-center justify-center bg-slate-100 dark:bg-slate-800">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">
            {product.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{product.category?.name || 'Uncategorised'}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-bold text-brand-600 dark:text-brand-400">{money(product.sellingPrice)}</span>
          <span
            className={`badge ${
              out
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                : low
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {out ? 'Out' : `${product.stockQuantity} ${product.unit.toLowerCase()}`}
          </span>
        </div>
      </div>
    </button>
  );
}
