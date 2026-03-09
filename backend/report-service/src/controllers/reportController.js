import axios from 'axios';
import Report from '../models/Report.js';

const getAuthHeader = (req) => ({
    headers: { Authorization: req.headers.authorization }
});

const urls = {
    appointment: process.env.APPOINTMENT_SERVICE_URL,
    inventory: process.env.INVENTORY_SERVICE_URL,
    patient: process.env.PATIENT_SERVICE_URL,
    billing: process.env.BILLING_SERVICE_URL,
    doctor: process.env.DOCTOR_SERVICE_URL
};

// ─── AGGREGATED STATS ────────────────────────────────────────────────────────

export const getAppointmentStats = async (req, res) => {
    try {
        const response = await axios.get(urls.appointment, getAuthHeader(req));
        const appointments = response.data.appointments || [];

        const stats = {
            total: appointments.length,
            byStatus: appointments.reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {}),
            monthlyTrend: [] // Simplified for now
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('getAppointmentStats failed:', error.message);
        res.status(200).json({ total: 0, byStatus: {}, monthlyTrend: [] });
    }
};

export const getInventorySummary = async (req, res) => {
    try {
        const response = await axios.get(urls.inventory, getAuthHeader(req));
        const items = response.data.items || [];

        const stats = {
            totalItems: items.length,
            categories: items.reduce((acc, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
                return acc;
            }, {}),
            lowStockItems: items.filter(i => i.quantity < 10).length,
            valuation: items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('getInventorySummary failed:', error.message);
        res.status(200).json({ totalItems: 0, categories: {}, lowStockItems: 0, valuation: 0 });
    }
};

export const getPatientDemographics = async (req, res) => {
    try {
        const response = await axios.get(urls.patient, getAuthHeader(req));
        const patients = response.data.patients || [];

        const stats = {
            totalPatients: patients.length,
            genderDist: patients.reduce((acc, curr) => {
                acc[curr.gender] = (acc[curr.gender] || 0) + 1;
                return acc;
            }, {}),
            ageGroups: {} // Simplified
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error('getPatientDemographics failed:', error.message);
        res.status(200).json({ totalPatients: 0, genderDist: {}, ageGroups: {} });
    }
};

// ─── DETAILED REGISTRIES ─────────────────────────────────────────────────────

export const getDetailedPatients = async (req, res) => {
    try {
        const response = await axios.get(urls.patient, getAuthHeader(req));
        res.status(200).json(response.data.patients || []);
    } catch (error) {
        console.error('getDetailedPatients failed:', error.message);
        res.status(200).json([]);
    }
};

export const getDetailedInventory = async (req, res) => {
    try {
        const response = await axios.get(urls.inventory, getAuthHeader(req));
        res.status(200).json(response.data.items || []);
    } catch (error) {
        console.error('getDetailedInventory failed:', error.message);
        res.status(200).json([]);
    }
};

export const getDetailedBillings = async (req, res) => {
    try {
        const response = await axios.get(urls.billing, getAuthHeader(req));
        res.status(200).json(response.data.invoices || []);
    } catch (error) {
        console.error('getDetailedBillings failed:', error.message);
        res.status(200).json([]);
    }
};

export const getDetailedAppointments = async (req, res) => {
    try {
        const [aptRes, docRes, patRes] = await Promise.all([
            axios.get(urls.appointment, getAuthHeader(req)),
            axios.get(urls.doctor, getAuthHeader(req)),
            axios.get(urls.patient, getAuthHeader(req))
        ]);

        const appointments = aptRes.data.appointments || [];
        const doctors = docRes.data.doctors || [];
        const patients = patRes.data.patients || [];

        const detailed = appointments.map(apt => {
            const doc = doctors.find(d => d.id === apt.doctorId || d.userId === apt.doctorId);
            const pat = patients.find(p => p.id === apt.patientId || p.userId === apt.patientId);
            return {
                ...apt.toJSON ? apt.toJSON() : apt,
                doctorName: doc ? doc.fullName : 'Unknown Doctor',
                patientName: pat ? pat.fullName : 'Unknown Patient',
                emrStatus: 'N/A' // Placeholder for now
            };
        });

        res.status(200).json(detailed);
    } catch (error) {
        console.error('getDetailedAppointments failed:', error.message);
        res.status(200).json([]);
    }
};

// ─── EXISTING PERSISTENCE ───────────────────────────────────────────────────

export const saveReport = async (req, res) => {
    try {
        const { title, type, data } = req.body;
        const report = await Report.create({
            title, type, data, generatedBy: req.user.id
        });
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
        const { id } = req.params;
        const { status } = req.body;

        // 1. Update status
        await axios.patch(`${urls.appointment}/${id}/status`, { status }, getAuthHeader(req));

        // 2. Fetch specific appointment to get patientId/doctorId
        const aptRes = await axios.get(`${urls.appointment}/${id}`, getAuthHeader(req));
        const apt = aptRes.data;

        // 3. Notify Patient about status change
        await axios.post(urls.notification || urls.appointment.replace('appointments', 'notifications'), {
            userId: apt.patientId,
            title: 'Appointment Status Updated',
            message: `Your appointment status has been changed to ${status}.`,
            type: 'info',
            link: '/appointments'
        }, getAuthHeader(req)).catch(() => { });

        res.status(200).json({ message: 'Appointment status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating appointment status' });
    }
};

export const getDoctorPerformance = async (req, res) => {
    try {
        const response = await axios.get(urls.doctor, getAuthHeader(req));
        const doctors = response.data.doctors || [];
        const perf = doctors.map(d => ({
            name: d.fullName,
            specialty: d.specialization,
            rating: 4.8, // Mocked as doctor profile doesn't have rating field yet
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
        const response = await axios.get(urls.doctor, getAuthHeader(req));
        res.status(200).json(response.data.doctors || []);
    } catch (error) {
        console.error('getDoctorRegistry failed:', error.message);
        res.status(200).json([]);
    }
};
