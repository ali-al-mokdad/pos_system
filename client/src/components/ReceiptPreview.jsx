import { browserPrint } from '../services/printerService';

export default function ReceiptPreview({ text, paperWidth = 80, note }) {
  if (!text) return null;
  return (
    <div>
      {note && <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
      <pre
        className="max-h-80 overflow-auto rounded-xl bg-slate-50 p-4 font-mono text-xs leading-tight text-slate-800 dark:bg-slate-800 dark:text-slate-100"
        style={{ width: paperWidth === 58 ? '22rem' : '30rem', maxWidth: '100%' }}
      >
        {text}
      </pre>
      <button type="button" className="btn-ghost mt-3" onClick={() => browserPrint(text, paperWidth)}>
        Print via browser
      </button>
    </div>
  );
}
