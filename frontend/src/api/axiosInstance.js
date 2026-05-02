import axios from 'axios';

// Longer timeout for Render free tier cold starts (can take 30-60s)
const axiosInstance = axios.create({
  timeout: 60000, // 60 seconds
});

// Auto-retry on 503/504 (service starting up / gateway timeout) — up to 3 times with 5s delay
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
      const delay = config._retryCount * 8000; // 8s, 16s, 24s — longer for cold starts
      console.log(`[Retry ${config._retryCount}/3] ${config.url} - waiting ${delay/1000}s (status: ${status || 'network error'})...`);
      await new Promise(r => setTimeout(r, delay));
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
