import axios from 'axios';

const API_URL = import.meta.env.VITE_API_NOTIFICATION_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const notificationService = {
    /**
     * Get all notifications for current user
     */
    getMyNotifications: async () => {
        const response = await axios.get(`${API_URL}/my`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Mark single notification as read
     */
    markAsRead: async (id) => {
        const response = await axios.patch(`${API_URL}/${id}/read`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Mark all notifications as read
     */
    markAllRead: async () => {
        const response = await axios.patch(`${API_URL}/read-all`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Delete notification
     */
    deleteNotification: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default notificationService;
