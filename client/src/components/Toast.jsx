import { useEffect } from 'react';

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(onDismiss, toast.type === 'error' ? 4000 : 2000);
    return () => clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const styles = {
    success: 'bg-brand-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-slate-800 text-white',
  };

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-lg ${styles[toast.type] || styles.info}`}>
        {toast.message}
      </div>
    </div>
  );
}
