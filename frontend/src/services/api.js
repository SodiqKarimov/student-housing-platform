import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// JWT token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token muddati tugasa yangilash
api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  getOneIdUrl: () => api.get('/auth/oneid/url'),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

export const studentApi = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getHousingStats: () => api.get('/students/stats/housing'),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  syncHemis: (id) => api.post(`/students/${id}/sync-hemis`),
  updateHousingType: (id, data) => api.patch(`/students/${id}/housing-type`, data),
};

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

export const dormitoryApi = {
  getAll: (params) => api.get('/dormitories', { params }),
  getById: (id) => api.get(`/dormitories/${id}`),
  create: (data) => api.post('/dormitories', data),
  getRooms: (dormId, params) => api.get(`/dormitories/${dormId}/rooms`, { params }),
  createRoom: (dormId, data) => api.post(`/dormitories/${dormId}/rooms`, data),
  getBookings: (params) => api.get('/dormitories/bookings', { params }),
  createBooking: (data) => api.post('/dormitories/bookings', data),
  reviewBooking: (id, data) => api.patch(`/dormitories/bookings/${id}/review`, data),
};

export const rentalApi = {
  getAll: (params) => api.get('/rentals', { params }),
  getById: (id) => api.get(`/rentals/${id}`),
  create: (data) => api.post('/rentals', data),
  verify: (id, data) => api.patch(`/rentals/${id}/verify`, data),
  getStats: () => api.get('/rentals/stats'),
};

export const commuterApi = {
  getAll: (params) => api.get('/commuters', { params }),
  create: (data) => api.post('/commuters', data),
  getStats: () => api.get('/commuters/stats'),
};

export default api;
