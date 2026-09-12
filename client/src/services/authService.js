import { api, setToken } from './api';

export const authService = {
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    return data.user;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      /* token may already be gone */
    }
    setToken(null);
  },
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  users: {
    list: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    remove: (id) => api.del(`/users/${id}`),
  },
};
