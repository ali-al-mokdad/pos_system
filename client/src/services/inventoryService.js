import { api, qs } from './api';

export const inventoryService = {
  overview: () => api.get('/inventory'),
  lowStock: () => api.get('/inventory/low-stock'),
  adjust: (payload) => api.post('/inventory/adjust', payload),
  movements: (params) => api.get(`/inventory/movements${qs(params)}`),
};
