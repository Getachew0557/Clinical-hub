import axios from './axiosInstance.js';

const API_URL = import.meta.env.VITE_API_DOCTOR_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const doctorService = {
    /**
     * Get all doctors (Admin/Receptionist/Doctor/Patient)
     */
    getAllDoctors: async (params = {}) => {
        const response = await axios.get(API_URL, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    /**
     * Get public doctor list (No auth required on backend for /public)
     */
    getPublicDoctors: async (params = {}) => {
        const response = await axios.get(`${API_URL}/public`, {
            params
        });
        return response.data;
    },

    /**
     * Get single doctor by ID
     */
    getDoctorById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get my personal doctor profile (Doctor role only)
     */
    getMyProfile: async () => {
        const response = await axios.get(`${API_URL}/my-profile`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Create new doctor profile (Admin only)
     */
    createDoctor: async (doctorData) => {
        const response = await axios.post(API_URL, doctorData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data' // For profile photo
            }
        });
        return response.data;
    },

    /**
     * Update doctor profile
     */
    updateDoctor: async (id, doctorData) => {
        const response = await axios.put(`${API_URL}/${id}`, doctorData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Toggle active/inactive status
     */
    toggleStatus: async (id, isActive) => {
        const response = await axios.patch(`${API_URL}/${id}/status`, { isActive }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Delete doctor profile
     */
    deleteDoctor: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default doctorService;
