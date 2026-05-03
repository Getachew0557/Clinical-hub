import axios from './axiosInstance.js';

const API_URL = import.meta.env.VITE_API_BILLING_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const billingService = {
    getPatientInvoices: async (patientId) => {
        const response = await axios.get(`${API_URL}/invoices/${patientId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },
    getAllInvoices: async (params = {}) => {
        const response = await axios.get(`${API_URL}/invoices`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },
    processPayment: async (paymentData) => {
        const response = await axios.post(`${API_URL}/pay`, paymentData, {
            headers: getAuthHeader()
        });
        return response.data;
    },
    createInvoice: async (invoiceData) => {
        const response = await axios.post(`${API_URL}/invoices`, invoiceData, {
            headers: getAuthHeader()
        });
        return response.data;
    },
    submitProof: async (formData) => {
        const response = await axios.post(`${API_URL}/submit-proof`, formData, {
            headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    approvePayment: async (paymentId) => {
        const response = await axios.patch(`${API_URL}/approve/${paymentId}`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },
    rejectPayment: async (paymentId, reason) => {
        const response = await axios.patch(`${API_URL}/reject/${paymentId}`, { reason }, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default billingService;
