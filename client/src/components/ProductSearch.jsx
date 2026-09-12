import { useEffect, useState } from 'react';

/** Debounced product search box (name / SKU / barcode / category). */
export default function ProductSearch({ value, onChange, inputRef, placeholder = 'Search by name, SKU or category (F2)' }) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => setLocal(value || ''), [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 250);
    return () => clearTimeout(id);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      ref={inputRef}
      type="search"
      className="input"
      placeholder={placeholder}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
    />
  );
}
