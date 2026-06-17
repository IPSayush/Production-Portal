import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: false,
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
  (res) => res,
  (err) => {
    // Only handle 401 from server responses (not network errors)
    if (err.response?.status === 401) {
      // Session invalidated by server (viewer logged in elsewhere, or token expired)
      localStorage.removeItem('prod_portal_token');
      localStorage.removeItem('prod_portal_user');
      if (onUnauthorized) {
        onUnauthorized(err.response?.data?.message);
      } else {
        window.location.href = '/landing';
      }
    }
    // For network errors, do NOT clear the token — the user may just be offline
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (userId, password, role) =>
    api.post('/auth/login', { userId, password, role }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const sheetsApi = {
  getAll: (page = 1, limit = 50) =>
    api.get('/sheets', { params: { page, limit } }),
  getOne: (id, page = 1, limit = 50) =>
    api.get(`/sheets/${id}`, { params: { page, limit } }),
  create: (data) => api.post('/sheets', data),
  update: (id, data) => api.put(`/sheets/${id}`, data),
  updateStatus: (id, status) => api.patch(`/sheets/${id}/status`, { status }),
  delete: (id, password) => api.delete(`/sheets/${id}`, { data: { password } }),
  addRow: (sheetId, data) => api.post(`/sheets/${sheetId}/rows`, data),
  updateRow: (sheetId, rowId, data) =>
    api.put(`/sheets/${sheetId}/rows/${rowId}`, data),
  deleteRow: (sheetId, rowId, password) =>
    api.delete(`/sheets/${sheetId}/rows/${rowId}`, { data: { password } }),
  searchByDate: (date, tz) =>
    api.get('/sheets/search', { params: { date, tz } }),
};

export default api;
