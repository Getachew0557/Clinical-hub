import axios from 'axios';

const API_URL = import.meta.env.VITE_API_SYSTEM_CHATBOT_URL || 'http://localhost:8005';

const chatbotService = {
  chat: async (message) => {
    try {
      const response = await axios.post(`${API_URL}/chat`, { message });
      return response.data;
    } catch (error) {
      console.error('Chatbot API error:', error);
      throw error;
    }
  },
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Chatbot health check failed:', error);
      throw error;
    }
  }
};

export default chatbotService;
