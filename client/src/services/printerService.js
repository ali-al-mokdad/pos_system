import { api } from './api';

export const printerService = {
  status: () => api.get('/printer/status'),
  test: () => api.post('/printer/test', {}),
  printReceipt: (saleId, reprint = false) => api.post('/printer/print-receipt', { saleId, reprint }),
};

/** Browser fallback: print the plain-text receipt through the OS print dialog. */
export function browserPrint(text, paperWidth = 80) {
  const w = window.open('', '_blank', 'width=420,height=640');
  if (!w) return;
  w.document.write(
    `<pre style="font-family:'Courier New',monospace;font-size:${paperWidth === 58 ? 11 : 12}px;white-space:pre-wrap">${text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</pre>`
  );
  w.document.close();
  w.focus();
  w.print();
}
