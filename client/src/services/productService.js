import { api, qs } from './api';

export const productService = {
  list: (params) => api.get(`/products${qs(params)}`),
  get: (id) => api.get(`/products/${id}`),
  byBarcode: (code) => api.get(`/products/barcode/${encodeURIComponent(code)}`),
  create: (formData) => api.post('/products', formData, { isForm: true }),
  update: (id, formData) => api.put(`/products/${id}`, formData, { isForm: true }),
  remove: (id) => api.del(`/products/${id}`),
};

export const categoryService = {
  list: (all) => api.get(`/categories${qs({ all })}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.del(`/categories/${id}`),
  reorder: (order) => api.put('/categories/reorder', { order }),
};
