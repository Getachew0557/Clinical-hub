import axios from '../api/axiosInstance.js';

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
        const isFormData = userData instanceof FormData;
        const response = await axios.patch(`${API_URL}/me`, userData, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                // Let browser set Content-Type for FormData (includes boundary)
                ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
            }
        });
        if (response.data.user) {
            // Merge into localStorage so Redux rehydrates correctly on next load
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            const merged = { ...stored, ...response.data.user };
            localStorage.setItem('user', JSON.stringify(merged));
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
    },

    forgotPassword: async (email) => {
        const response = await axios.post(`${API_URL}/forgot-password`, { email });
        return response.data;
    },

    resetPassword: async (token, newPassword) => {
        const response = await axios.post(`${API_URL}/reset-password`, { token, newPassword });
        return response.data;
    },

    // Google OAuth — sends the ID token from Google to our backend for verification
    googleAuth: async (idToken) => {
        // Note: no withCredentials — the access token comes in the response body.
        // The httpOnly refresh token cookie is set by the auth-service but may not
        // propagate through the gateway proxy; the access token is sufficient.
        const response = await axios.post(`${API_URL}/google`, { idToken });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // GDPR — anonymize and delete account
    deleteAccount: async (password) => {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_URL}/delete-account`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { password },
        });
        // Clear local session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return response.data;
    }
};

export default authService;
