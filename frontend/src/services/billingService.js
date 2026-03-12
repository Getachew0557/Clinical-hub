import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const billingService = {
    getInvoices: async (patientId) => {
        const response = await axios.get(`${API_URL}/billing/invoices/${patientId}`);
        return response.data;
    },

    payInvoice: async (invoiceId, amount, method) => {
        const response = await axios.post(`${API_URL}/billing/pay`, { invoiceId, amount, method });
        return response.data;
    },

    createInvoice: async (invoiceData) => {
        const response = await axios.post(`${API_URL}/billing/invoices`, invoiceData);
        return response.data;
    }
};

export default billingService;
