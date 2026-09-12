export default function CategoryFilter({ categories, value, onChange }) {
  const base = 'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition';
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`${base} ${!value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(String(c.id))}
          className={`${base} ${
            value === String(c.id) ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
