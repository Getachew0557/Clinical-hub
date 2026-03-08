import axios from 'axios';

const API_URL = import.meta.env.VITE_API_PATIENT_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const patientService = {
    /**
     * Get all patients (Admin/Receptionist)
     */
    getAllPatients: async (params = {}) => {
        const response = await axios.get(API_URL, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    /**
     * Get single patient by ID
     */
    getPatientById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Create new patient
     */
    createPatient: async (patientData) => {
        const response = await axios.post(API_URL, patientData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Update patient
     */
    updatePatient: async (id, patientData) => {
        const response = await axios.put(`${API_URL}/${id}`, patientData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Toggle active/inactive status (Admin only)
     */
    toggleStatus: async (id, isActive) => {
        const response = await axios.patch(`${API_URL}/${id}/status`, { isActive }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get my personal patient profile
     */
    getMyProfile: async () => {
        const response = await axios.get(`${API_URL}/my-profile`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Delete patient
     */
    deletePatient: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default patientService;
