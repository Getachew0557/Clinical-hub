import Report from '../models/Report.js';

/**
 * Get Appointment Statistics
 * Note: In a real system, this would call appointment-service or query a flattened view.
 * For this demo, we simulate aggregation and return a summary.
 */
export const getAppointmentStats = async (req, res) => {
    try {
        // Simulated static aggregation (concept proof)
        const stats = {
            total: 150,
            byStatus: {
                Confirmed: 80,
                Pending: 40,
                Cancelled: 20,
                Completed: 10
            },
            monthlyTrend: [
                { month: 'January', count: 45 },
                { month: 'February', count: 52 },
                { month: 'March', count: 53 }
            ]
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Inventory Summary
 */
export const getInventorySummary = async (req, res) => {
    try {
        const stats = {
            totalItems: 42,
            categories: {
                Supplies: 30,
                Equipment: 12
            },
            lowStockItems: 5,
            valuation: 12500.00
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Patient Demographics
 */
export const getPatientDemographics = async (req, res) => {
    try {
        const stats = {
            totalPatients: 1200,
            genderDist: {
                Male: 550,
                Female: 650
            },
            ageGroups: {
                '0-18': 200,
                '19-40': 600,
                '41-60': 300,
                '60+': 100
            }
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Save a generated report
 */
export const saveReport = async (req, res) => {
    try {
        const { title, type, data } = req.body;

        const report = await Report.create({
            title,
            type,
            data,
            generatedBy: req.user.id
        });

        res.status(201).json({ message: 'Report saved successfully', report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * List all saved reports
 */
export const getSavedReports = async (req, res) => {
    try {
        const reports = await Report.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Detailed Patient Registry
 */
export const getDetailedPatients = async (req, res) => {
    try {
        // Simulated detailed data
        const patients = [
            { id: 'P001', name: 'Abebe Bikila', gender: 'Male', age: 34, phone: '0911223344', regDate: '2025-01-15', status: 'Active' },
            { id: 'P002', name: 'Chala Gebre', gender: 'Male', age: 28, phone: '0922334455', regDate: '2025-02-10', status: 'Inactive' },
            { id: 'P003', name: 'Marta Hailu', gender: 'Female', age: 45, phone: '0933445566', regDate: '2025-03-01', status: 'Active' },
            { id: 'P004', name: 'Sara Bekele', gender: 'Female', age: 22, phone: '0944556677', regDate: '2025-03-05', status: 'Active' }
        ];
        res.status(200).json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Detailed Inventory Items
 */
export const getDetailedInventory = async (req, res) => {
    try {
        const items = [
            { id: 'INV001', name: 'Amoxicillin 500mg', category: 'Medication', quantity: 150, unit: 'Capsule', status: 'In Stock', expiry: '2026-05-12' },
            { id: 'INV002', name: 'Paracetamol', category: 'Medication', quantity: 20, unit: 'Tablet', status: 'Low Stock', expiry: '2025-08-20' },
            { id: 'INV003', name: 'Dental Mirror', category: 'Equipment', quantity: 15, unit: 'Piece', status: 'In Stock', expiry: 'N/A' },
            { id: 'INV004', name: 'Latex Gloves', category: 'Supplies', quantity: 5, unit: 'Box', status: 'Critical', expiry: '2025-12-01' }
        ];
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Detailed Billing/Payments
 */
export const getDetailedBillings = async (req, res) => {
    try {
        const bills = [
            { id: 'B001', patient: 'Abebe Bikila', amount: 1500, date: '2025-03-01', status: 'Paid', method: 'Cash' },
            { id: 'B002', patient: 'Chala Gebre', amount: 2400, date: '2025-03-04', status: 'Pending', method: 'Bank Transfer' },
            { id: 'B003', patient: 'Marta Hailu', amount: 800, date: '2025-03-06', status: 'Overdue', method: 'N/A' },
            { id: 'B004', patient: 'Sara Bekele', amount: 3200, date: '2025-03-08', status: 'Paid', method: 'Insurance' }
        ];
        res.status(200).json(bills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
/**
 * Get Detailed Appointments with Doctor & EMR Status
 */
export const getDetailedAppointments = async (req, res) => {
    try {
        const appointments = [
            { id: 'APT001', patientName: 'Abebe Bikila', doctorName: 'Dr. Solomon', date: '2025-03-10', time: '10:00 AM', status: 'Confirmed', emrStatus: 'Drafted' },
            { id: 'APT002', patientName: 'Chala Gebre', doctorName: 'Dr. Sara', date: '2025-03-10', time: '11:30 AM', status: 'Pending', emrStatus: 'None' },
            { id: 'APT003', patientName: 'Marta Hailu', doctorName: 'Dr. Solomon', date: '2025-03-11', time: '09:00 AM', status: 'Completed', emrStatus: 'Finalized' },
            { id: 'APT004', patientName: 'Sara Bekele', doctorName: 'Dr. Tadesse', date: '2025-03-12', time: '02:00 PM', status: 'Cancelled', emrStatus: 'Archived' }
        ];
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update Appointment Status (Report Interface CRUD)
 */
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // In a real system, this would call the appointment-service or update DB directly
        console.log(`Updating appointment ${id} to status ${status}`);

        res.status(200).json({ message: 'Appointment status updated successfully', id, status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Doctor Performance metrics
 */
export const getDoctorPerformance = async (req, res) => {
    try {
        const performance = [
            { name: 'Dr. Solomon', patients: 45, surgery: 12, rating: 4.8 },
            { name: 'Dr. Sara', patients: 38, surgery: 8, rating: 4.9 },
            { name: 'Dr. Tadesse', patients: 30, surgery: 5, rating: 4.5 },
            { name: 'Dr. Helina', patients: 25, surgery: 3, rating: 4.7 }
        ];
        res.status(200).json(performance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Detailed Doctor Registry
 */
export const getDoctorRegistry = async (req, res) => {
    try {
        const doctors = [
            { id: 'DOC001', name: 'Dr. Solomon', specialty: 'General Dentist', department: 'Oral Health', contact: 'solomon@clinic.com', surgeries: 120, status: 'On Duty' },
            { id: 'DOC002', name: 'Dr. Sara', specialty: 'Orthodontist', department: 'Braces & Aligners', contact: 'sara@clinic.com', surgeries: 85, status: 'On Duty' },
            { id: 'DOC003', name: 'Dr. Tadesse', specialty: 'Periodontist', department: 'Gum Disease', contact: 'tadesse@clinic.com', surgeries: 45, status: 'On Leave' },
            { id: 'DOC004', name: 'Dr. Helina', specialty: 'Endodontist', department: 'Root Canals', contact: 'helina@clinic.com', surgeries: 62, status: 'On Duty' }
        ];
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
