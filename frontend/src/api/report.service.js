import axios from 'axios';

const API_URL = import.meta.env.VITE_API_REPORT_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const reportService = {
    /**
     * Get appointment statistics
     */
    getAppointmentStats: async () => {
        const response = await axios.get(`${API_URL}/appointments/stats`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get inventory summary
     */
    getInventorySummary: async () => {
        const response = await axios.get(`${API_URL}/inventory/summary`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get patient demographics
     */
    getPatientDemographics: async () => {
        const response = await axios.get(`${API_URL}/patients/demographics`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get all saved reports
     */
    getSavedReports: async () => {
        const response = await axios.get(`${API_URL}/saved`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get detailed patient registry
     */
    getDetailedPatients: async () => {
        const response = await axios.get(`${API_URL}/detailed/patients`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get detailed inventory
     */
    getDetailedInventory: async () => {
        const response = await axios.get(`${API_URL}/detailed/inventory`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get detailed billings
     */
    getDetailedBillings: async () => {
        const response = await axios.get(`${API_URL}/detailed/billings`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Save a new report
     */
    saveReport: async (reportData) => {
        const response = await axios.post(`${API_URL}/save`, reportData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get detailed appointment list
     */
    getDetailedAppointments: async () => {
        const response = await axios.get(`${API_URL}/detailed/appointments`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get doctor performance metrics
     */
    getDoctorPerformance: async () => {
        const response = await axios.get(`${API_URL}/doctors/performance`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get detailed doctor list
     */
    getDetailedDoctors: async () => {
        const response = await axios.get(`${API_URL}/detailed/doctors`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Update appointment status
     */
    updateAppointmentStatus: async (appointmentId, status) => {
        const response = await axios.patch(`${API_URL}/appointments/${appointmentId}/status`, { status }, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default reportService;
