import { useEffect } from 'react';

export default function Modal({ open, title, onClose, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-modal-open="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`card w-full ${width} max-h-[90vh] overflow-hidden`}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <h3 className="text-base font-bold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg px-2 text-xl text-slate-400 hover:text-slate-700">
            ×
          </button>
        </header>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">{footer}</footer>}
      </div>
    </div>
  );
}
