import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_AUTH_URL?.replace('/api/auth', '') || 'http://localhost:5050';

// Longer timeout for Render free tier cold starts (can take 30-60s)
const axiosInstance = axios.create({
  timeout: 60000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Auto-retry on 503/504 (service starting up / gateway timeout) — up to 3 times with 8s delay
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const status = error.response?.status;
    config._retryCount = config._retryCount || 0;

    // Retry on 503 (service unavailable), 504 (gateway timeout), or network errors
    if ((status === 503 || status === 504 || !error.response) && config._retryCount < 3) {
      config._retryCount += 1;
      const delay = config._retryCount * 8000;
      console.log(`[Retry ${config._retryCount}/3] ${config.url} - waiting ${delay/1000}s (status: ${status || 'network error'})...`);
      await new Promise(r => setTimeout(r, delay));
      return axiosInstance(config);
    }

    // Auto-refresh on 401 (expired access token)
    if (status === 401 && !config._retry && !config.url?.includes('/api/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          config.headers['Authorization'] = `Bearer ${token}`;
          return axiosInstance(config);
        }).catch(err => Promise.reject(err));
      }

      config._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${API_BASE}/api/auth/refresh`,
          {},
          { withCredentials: true, timeout: 15000 }
        );
        const newToken = refreshRes.data.token;
        localStorage.setItem('token', newToken);

        // Update stored user token
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored.id) localStorage.setItem('user', JSON.stringify(stored));

        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        config.headers['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return axiosInstance(config);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Refresh failed — clear session and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
