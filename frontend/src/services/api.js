import axios from 'axios';

const TOKEN_KEY = 'finevsis_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: body => api.post('/api/users/login', body),
  register: body => api.post('/api/users/register', body),
  me: () => api.get('/api/users/me'),
  updateMe: body => api.put('/api/users/me', body),
};

export const trendsAPI = {
  getAll: params => api.get('/api/trends', { params }),
};

export const opportunitiesAPI = {
  getAll: params => api.get('/api/opportunities', { params }),
  researchLive: params => api.get('/api/opportunities/research-live', { params }),
  analyzeAI: body => api.post('/api/opportunities/analyze-ai', body),
};

export const projectsAPI = {
  getAll: params => api.get('/api/projects', { params }),
  create: body => api.post('/api/projects', body),
  generate: () => api.post('/api/projects/generate'),
};

export const analysisAPI = {
  dashboard: () => api.get('/api/analysis/dashboard'),
  marketInsights: body => api.post('/api/analysis/market-insights', body),
  etl: body => api.post('/api/analysis/etl', body),
};

export default api;
