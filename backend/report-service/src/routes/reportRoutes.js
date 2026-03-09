import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    getAppointmentStats,
    getInventorySummary,
    getPatientDemographics,
    saveReport,
    getSavedReports,
    getDetailedPatients,
    getDetailedInventory,
    getDetailedBillings,
    getDetailedAppointments,
    updateAppointmentStatus,
    getDoctorPerformance,
    getDoctorRegistry
} from '../controllers/reportController.js';

const router = express.Router();

// ─── Routes (Admin Only) ──────────────────────────────────────────────────

router.use(protect);
router.use(authorize('Admin'));

router.get('/appointments/stats', getAppointmentStats);
router.get('/inventory/summary', getInventorySummary);
router.get('/patients/demographics', getPatientDemographics);

router.get('/detailed/patients', getDetailedPatients);
router.get('/detailed/inventory', getDetailedInventory);
router.get('/detailed/billings', getDetailedBillings);
router.get('/detailed/appointments', getDetailedAppointments);
router.get('/doctors/performance', getDoctorPerformance);
router.get('/detailed/doctors', getDoctorRegistry);
router.patch('/appointments/:id/status', updateAppointmentStatus);

router.get('/saved', getSavedReports);
router.post('/save', saveReport);

export default router;
