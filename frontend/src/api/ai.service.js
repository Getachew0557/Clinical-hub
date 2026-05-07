import axios from './axiosInstance.js';

const API_URL = import.meta.env.VITE_API_AI_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const aiService = {
    /**
     * Landing Page Public Chat
     */
    getPublicChatResponse: async (message, history = []) => {
        const response = await axios.post(`${API_URL}/public-chat`, { message, history });
        return response.data;
    },

    /**
     * Clinical Diagnosis Analysis (Doctor)
     */
    analyzeDiagnosis: async (data) => {
        const response = await axios.post(`${API_URL}/analyze-diagnosis`, data, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Treatment Suggestion (Doctor)
     */
    suggestTreatment: async (diagnosis, patientProfile) => {
        const response = await axios.post(`${API_URL}/suggest-treatment`, { diagnosis, patientProfile }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Generative Chat (Staff)
     */
    clinicalChat: async (message, context = []) => {
        const response = await axios.post(`${API_URL}/chat`, { message, context }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Context-Aware Page Assistant
     */
    getContextAssistantResponse: async (message, pageName, userRole, history = []) => {
        const response = await axios.post(`${API_URL}/context-assistant`, { message, pageName, userRole, history }, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default aiService;

