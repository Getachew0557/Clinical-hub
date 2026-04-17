import axios from 'axios';

// Longer timeout for Render free tier cold starts (can take 30-60s)
const axiosInstance = axios.create({
  timeout: 60000, // 60 seconds
});

export default axiosInstance;
