import axios from 'axios';
import Report from '../models/Report.js';

const getAuthHeader = (req) => ({ headers: { Authorization: req.headers.authorization } });

const getUrls = () => ({
    appointment: process.env.APPOINTMENT_SERVICE_URL,
    inventory: `http://localhost:${process.env.PORT || 5010}/api/inventory`,
    patient: process.env.PATIENT_SERVICE_URL,
    billing: `${process.env.BILLING_SERVICE_URL}/invoices`,
    doctor: `http://localhost:${process.env.PORT || 5010}/api/doctors`
});

export const getFinancialSummary = async (req, res) => {
    try {
        const urls = getUrls();
        const { role, id: userId } = req.user;
        const queryParams = role === 'Doctor' ? { params: { doctorId: userId } } : {};

        const response = await axios.get(urls.billing, { ...getAuthHeader(req), ...queryParams });
        const invoices = Array.isArray(response.data) ? response.data : (response.data.invoices || []);

        const summary = {
            totalRevenue: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + parseFloat(i.amount), 0),
            pendingAmount: invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + parseFloat(i.amount), 0),
            invoiceCount: invoices.length,
            pendingCount: invoices.filter(i => i.status === 'Pending').length
        };
        res.status(200).json(summary);
    } catch (error) {
        console.error('getFinancialSummary failed:', error.message);
        res.status(200).json({ totalRevenue: 0, pendingAmount: 0, invoiceCount: 0, pendingCount: 0 });
    }
};

export const getAppointmentStats = async (req, res) => {
    try {
        const urls = getUrls();
        const { role, id: userId } = req.user;
        let queryParams = { ...req.query };
        if (role === 'Doctor') queryParams.doctorId = userId;

        const response = await axios.get(urls.appointment, { ...getAuthHeader(req), params: queryParams });
        const appointments = response.data.appointments || [];

        const monthlyTrendMap = {};
        appointments.forEach(apt => {
            if (!apt.appointmentDate) return;
            const monthObj = new Date(apt.appointmentDate);
            if (isNaN(monthObj)) return;
            const monthName = monthObj.toLocaleString('default', { month: 'short' });
            monthlyTrendMap[monthName] = (monthlyTrendMap[monthName] || 0) + 1;
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTrend = monthNames.map(name => ({
            name,
            count: monthlyTrendMap[name] || 0
        }));

        const stats = {
            total: appointments.length,
            byStatus: appointments.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {}),
            monthlyTrend
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('getAppointmentStats failed:', error.message);
        res.status(200).json({ total: 0, byStatus: {}, monthlyTrend: [] });
    }
};

export const getInventorySummary = async (req, res) => {
    try {
        const items = await (await import('../models/InventoryItem.js')).default.findAll({ where: { isActive: true } });
        const stats = {
            totalItems: items.length,
            categories: items.reduce((acc, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
                return acc;
            }, {}),
            lowStockItems: items.filter(i => i.quantity <= i.reorderLevel).length,
            valuation: items.reduce((sum, i) => sum + (parseFloat(i.pricePerUnit || 0) * i.quantity), 0)
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('getInventorySummary failed:', error.message);
        res.status(200).json({ totalItems: 0, categories: {}, lowStockItems: 0, valuation: 0 });
    }
};

export const getPatientDemographics = async (req, res) => {
    try {
        const urls = getUrls();
        const { role, id: userId } = req.user;
        let patients = [];

        if (role === 'Doctor') {
            const aptRes = await axios.get(`${urls.appointment}/my`, getAuthHeader(req));
            const appointments = aptRes.data.appointments || [];
            const patientIds = [...new Set(appointments.map(a => a.patientId))];
            if (patientIds.length > 0) {
                const patRes = await axios.get(urls.patient, { ...getAuthHeader(req), params: { ids: patientIds.join(',') } });
                patients = patRes.data.patients || [];
            }
        } else {
            const response = await axios.get(urls.patient, getAuthHeader(req));
            patients = response.data.patients || [];
        }

        const stats = {
            totalPatients: patients.length,
            genderDist: patients.reduce((acc, curr) => {
                acc[curr.gender || 'Other'] = (acc[curr.gender || 'Other'] || 0) + 1;
                return acc;
            }, {}),
            ageGroups: {}
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('getPatientDemographics failed:', error.message);
        res.status(200).json({ totalPatients: 0, genderDist: {}, ageGroups: {} });
    }
};

export const getDetailedPatients = async (req, res) => {
    try {
        const urls = getUrls();
        const { role, id: userId } = req.user;
        let queryParams = {};

        if (role === 'Doctor') {
            const aptRes = await axios.get(urls.appointment, { ...getAuthHeader(req), params: { doctorId: userId } });
            const appointments = aptRes.data.appointments || [];
            const patientIds = [...new Set(appointments.map(a => a.patientId))];
            if (patientIds.length === 0) return res.status(200).json([]);
            queryParams.ids = patientIds.join(',');
        }

        const response = await axios.get(urls.patient, { ...getAuthHeader(req), params: queryParams });
        res.status(200).json(response.data.patients || []);
    } catch (error) {
        console.error('getDetailedPatients failed:', error.message);
        res.status(200).json([]);
    }
};

export const getDetailedInventory = async (req, res) => {
    try {
        const InventoryItem = (await import('../models/InventoryItem.js')).default;
        const items = await InventoryItem.findAll({ where: { isActive: true } });
        res.status(200).json(items);
    } catch (error) {
        console.error('getDetailedInventory failed:', error.message);
        res.status(200).json([]);
    }
};

export const getDetailedBillings = async (req, res) => {
    try {
        const urls = getUrls();
        const { role, id: userId } = req.user;
        const queryParams = role === 'Doctor' ? { params: { doctorId: userId } } : {};
        const response = await axios.get(urls.billing, { ...getAuthHeader(req), ...queryParams });
        const invoices = Array.isArray(response.data) ? response.data : (response.data.invoices || []);
        res.status(200).json(invoices);
    } catch (error) {
        console.error('getDetailedBillings failed:', error.message);
        res.status(200).json([]);
    }
};

export const getDetailedAppointments = async (req, res) => {
    try {
        const urls = getUrls();
        const { role, id: userId } = req.user;
        const appointmentParams = role === 'Doctor' ? { params: { doctorId: userId } } : {};

        const [aptRes, patRes] = await Promise.all([
            axios.get(urls.appointment, { ...getAuthHeader(req), ...appointmentParams }),
            axios.get(urls.patient, getAuthHeader(req))
        ]);

        const appointments = aptRes.data.appointments || [];
        const patients = patRes.data.patients || [];

        const detailed = appointments.map(apt => {
            const pat = patients.find(p => p.userId === apt.patientId || p.id === apt.patientId);
            return {
                ...(apt.toJSON ? apt.toJSON() : apt),
                patientName: pat ? pat.fullName : `Patient (${apt.patientId.slice(-6)})`,
            };
        });

        res.status(200).json(detailed);
    } catch (error) {
        console.error('getDetailedAppointments failed:', error.message);
        res.status(200).json([]);
    }
};

export const saveReport = async (req, res) => {
    try {
        const { title, type, data } = req.body;
        const report = await Report.create({ title, type, data, generatedBy: req.user.id });
        res.status(201).json({ message: 'Report saved successfully', report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSavedReports = async (req, res) => {
    try {
        const reports = await Report.findAll({ order: [['createdAt', 'DESC']] });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const urls = getUrls();
        const { id } = req.params;
        const { status } = req.body;
        await axios.patch(`${urls.appointment}/${id}/status`, { status }, getAuthHeader(req));
        res.status(200).json({ message: 'Appointment status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating appointment status' });
    }
};

export const getDoctorPerformance = async (req, res) => {
    try {
        const DoctorProfile = (await import('../models/DoctorProfile.js')).default;
        const doctors = await DoctorProfile.findAll();
        const perf = doctors.map(d => ({
            name: d.fullName,
            specialty: d.specialization,
            rating: 4.8,
            experience: d.experience
        }));
        res.status(200).json(perf);
    } catch (error) {
        console.error('getDoctorPerformance failed:', error.message);
        res.status(200).json([]);
    }
};

export const getDoctorRegistry = async (req, res) => {
    try {
        const DoctorProfile = (await import('../models/DoctorProfile.js')).default;
        const doctors = await DoctorProfile.findAll();
        res.status(200).json(doctors);
    } catch (error) {
        console.error('getDoctorRegistry failed:', error.message);
        res.status(200).json([]);
    }
};
