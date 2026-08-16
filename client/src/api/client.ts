import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT if available ─────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('placementpal_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle errors + 401 redirect ───
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // On 401, clear stale token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('placementpal_access_token');
      // Only redirect if not already on an auth page
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup' && path !== '/') {
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

