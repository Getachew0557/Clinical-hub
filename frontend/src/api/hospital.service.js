import axios from './axiosInstance.js';

const API_URL = import.meta.env.VITE_API_BILLING_URL?.replace(/\/api\/billing$/, '/api/hospitals') || 'http://localhost:5050/api/hospitals';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const hospitalService = {
    getAllHospitals: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },
    getHospitalById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    },
    createHospital: async (formData) => {
        const response = await axios.post(API_URL, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    updateHospital: async (id, formData) => {
        const response = await axios.put(`${API_URL}/${id}`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    deleteHospital: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default hospitalService;
