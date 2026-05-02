import axios from 'axios';

const API_URL = import.meta.env.VITE_API_NOTIFICATION_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Dedicated axios instance for notifications — short timeout so a cold service
// never blocks the UI. Notifications are non-critical; they fail silently.
const notifyAxios = axios.create({ timeout: 10000 });

const notificationService = {
    getMyNotifications: async () => {
        const response = await notifyAxios.get(`${API_URL}/my`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await notifyAxios.patch(`${API_URL}/${id}/read`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    markAllRead: async () => {
        const response = await notifyAxios.patch(`${API_URL}/read-all`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    deleteNotification: async (id) => {
        const response = await notifyAxios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default notificationService;

