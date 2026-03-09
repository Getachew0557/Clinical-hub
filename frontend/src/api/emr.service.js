import axios from 'axios';

const API_URL = import.meta.env.VITE_API_EMR_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const emrService = {
    /**
     * Create new EMR record
     */
    createRecord: async (recordData) => {
        const response = await axios.post(API_URL, recordData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get records for a specific patient
     */
    getPatientRecords: async (patientId) => {
        const response = await axios.get(`${API_URL}/patient/${patientId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get single record by ID
     */
    getRecordById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Update record
     */
    updateRecord: async (id, recordData) => {
        const response = await axios.put(`${API_URL}/${id}`, recordData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Delete record
     */
    deleteRecord: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default emrService;
