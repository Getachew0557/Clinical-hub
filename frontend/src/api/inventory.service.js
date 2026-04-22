import axios from './axiosInstance.js';

const API_URL = import.meta.env.VITE_API_INVENTORY_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const inventoryService = {
    /**
     * Get all inventory items
     * Roles: Admin, Doctor, Receptionist
     */
    getAllItems: async (params = {}) => {
        const response = await axios.get(API_URL, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    /**
     * Get single item details (and history)
     * Roles: Admin, Doctor, Receptionist
     */
    getItemDetails: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Create new inventory item
     * Roles: Admin, Receptionist
     */
    createItem: async (itemData) => {
        const response = await axios.post(API_URL, itemData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Update stock level (add or remove)
     * Roles: Admin, Receptionist
     */
    updateStock: async (id, stockData) => {
        const response = await axios.patch(`${API_URL}/${id}/stock`, stockData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Delete inventory item
     * Roles: Admin
     */
    deleteItem: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default inventoryService;

