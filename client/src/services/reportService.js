import { api, qs } from './api';

export const reportService = {
  dashboard: (params) => api.get(`/reports/dashboard${qs(params)}`),
  sales: (params) => api.get(`/reports/sales${qs(params)}`),
  profit: (params) => api.get(`/reports/profit${qs(params)}`),
  products: (params) => api.get(`/reports/products${qs(params)}`),
  inventory: () => api.get('/reports/inventory'),
};

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export function exportCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
