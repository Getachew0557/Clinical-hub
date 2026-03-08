import axios from 'axios';

const API_URL = import.meta.env.VITE_API_APPOINTMENT_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const appointmentService = {
    /**
     * Get all appointments (Admin/Receptionist)
     * Supports filtering by status and date
     */
    getAllAppointments: async (params = {}) => {
        const response = await axios.get(API_URL, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    /**
     * Get my appointments (Doctor/Patient)
     */
    getMyAppointments: async () => {
        const response = await axios.get(`${API_URL}/my`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Get single appointment details
     */
    getAppointmentById: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Book a new appointment
     */
    createAppointment: async (appointmentData) => {
        const response = await axios.post(API_URL, appointmentData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Update appointment details/reschedule
     */
    updateAppointment: async (id, appointmentData) => {
        const response = await axios.put(`${API_URL}/${id}`, appointmentData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Update appointment status (Pending, Confirmed, Cancelled, Completed)
     */
    updateStatus: async (id, status) => {
        const response = await axios.patch(`${API_URL}/${id}/status`, { status }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    /**
     * Delete appointment (Admin only)
     */
    deleteAppointment: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default appointmentService;
