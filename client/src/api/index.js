import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prod_portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized(error.response?.data?.message);
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (userId, password, role) =>
    api.post('/auth/login', { userId, password, role }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const sheetsApi = {
  getAll: () => api.get('/sheets'),
  getOne: (id) => api.get(`/sheets/${id}`),
  create: (data) => api.post('/sheets', data),
  update: (id, data) => api.put(`/sheets/${id}`, data),
  delete: (id, password) => api.delete(`/sheets/${id}`, { data: { password } }),
  addRow: (sheetId, data) => api.post(`/sheets/${sheetId}/rows`, data),
  updateRow: (sheetId, rowId, data) =>
    api.put(`/sheets/${sheetId}/rows/${rowId}`, data),
  deleteRow: (sheetId, rowId, password) =>
    api.delete(`/sheets/${sheetId}/rows/${rowId}`, { data: { password } }),
};

export default api;
