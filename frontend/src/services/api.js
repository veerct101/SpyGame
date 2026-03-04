import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin requests must not share the same storage key as players.
// Otherwise, opening a player tab overwrites the admin JWT and admin-only actions fail.
const adminApi = axios.create({
  baseURL: 'http://localhost:5000/api',
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (credentials) => api.post('/auth/register', credentials),
  getUsers: () => adminApi.get('/auth/users'),
};

export const gameAPI = {
  create: () => adminApi.post('/games'),
  addPlayers: (gameId, playerIds) => adminApi.post(`/games/${gameId}/players`, { playerIds }),
  start: (gameId, payload) => adminApi.put(`/games/${gameId}/start`, payload),
  getStatus: (gameId) => api.get(`/games/${gameId}/status`),
  getAdminStatus: (gameId) => adminApi.get(`/games/${gameId}/admin/status`),
  getWord: (gameId) => api.get(`/games/${gameId}/word`),
};

export const voteAPI = {
  submit: (gameId, targetId) => api.post(`/votes/${gameId}/vote`, { targetId }),
  triggerTally: (gameId) => adminApi.post(`/votes/${gameId}/tally`),
};

export default api;
