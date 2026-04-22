import axios from 'axios';

// Longer timeout for Render free tier cold starts (can take 30-60s)
const axiosInstance = axios.create({
  timeout: 60000, // 60 seconds
});

// Auto-retry on 503 (service starting up) — up to 3 times with 5s delay
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const status = error.response?.status;
    config._retryCount = config._retryCount || 0;

    // Retry on 503 (service unavailable / starting up) or network errors
    if ((status === 503 || !error.response) && config._retryCount < 3) {
      config._retryCount += 1;
      const delay = config._retryCount * 5000; // 5s, 10s, 15s
      console.log(`[Retry ${config._retryCount}/3] ${config.url} - waiting ${delay/1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
