import axios from 'axios';

const API_URL = import.meta.env.VITE_API_AUTH_URL;

const authService = {
    register: async (userData) => {
        const currentToken = localStorage.getItem('token');
        const config = currentToken ? { headers: { Authorization: `Bearer ${currentToken}` } } : {};

        const response = await axios.post(`${API_URL}/register`, userData, config);

        // Only set localStorage if it's a public sign-up (no current token)
        if (!currentToken && response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    login: async (credentials) => {
        const response = await axios.post(`${API_URL}/login`, credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },

    getMe: async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updateMe: async (userData) => {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/me`, userData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    changePassword: async (passwords) => {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/change-password`, passwords, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getAllUsers: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default authService;
