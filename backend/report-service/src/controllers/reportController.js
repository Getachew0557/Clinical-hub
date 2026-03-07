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
