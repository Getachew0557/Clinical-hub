import axios from './axiosInstance.js';

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
     * Book a new appointment (with optional file attachment via FormData)
     */
    createAppointmentWithFile: async (formData) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(API_URL, formData, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                'Content-Type': 'multipart/form-data'
            }
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
     * Approve appointment (Admin/Receptionist)
     */
    approveAppointment: async (id) => {
        const response = await axios.patch(`${API_URL}/${id}/approve`, {}, {
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
    },

    /**
     * Get status counts (live + cumulative) per status for the dashboard
     * Doctor: scoped to own appointments. Admin/Receptionist: all.
     * @param {object} params - optional { type: 'clinic' | 'video' }
     */
    getStatusCounts: async (params = {}) => {
        const response = await axios.get(`${API_URL}/status-counts`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    /**
     * Get availability slots for a doctor on a specific date
     * @param {string} type - 'clinic' | 'video' | 'all'
     */
    getAvailability: async (doctorId, date, type = 'clinic') => {
        const response = await axios.get(`${API_URL}/availability/${doctorId}`, {
            headers: getAuthHeader(),
            params: { date, type }
        });
        return response.data;
    }
};

export default appointmentService;

