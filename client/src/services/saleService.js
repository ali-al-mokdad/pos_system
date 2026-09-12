import { api, qs } from './api';

export const saleService = {
  list: (params) => api.get(`/sales${qs(params)}`),
  get: (id) => api.get(`/sales/${id}`),
  create: (payload) => api.post('/sales', payload),
  refund: (id, payload) => api.post(`/sales/${id}/refund`, payload),
  reprint: (id) => api.post(`/sales/${id}/reprint`, {}),
  held: {
    list: () => api.get('/sales/held/list'),
    create: (label, payload) => api.post('/sales/held', { label, payload }),
    remove: (id) => api.del(`/sales/held/${id}`),
  },
};

export const shiftService = {
  list: () => api.get('/shifts'),
  get: (id) => api.get(`/shifts/${id}`),
  open: (openingCash) => api.post('/shifts/open', { openingCash }),
  close: (id, actualCash, note) => api.post(`/shifts/${id}/close`, { actualCash, note }),
};
