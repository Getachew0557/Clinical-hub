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
    getDoctorRegistry,
    getFinancialSummary
} from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);

router.get('/appointments/stats', authorize('Admin', 'Receptionist', 'Doctor'), getAppointmentStats);
router.get('/finance/summary', authorize('Admin', 'Receptionist'), getFinancialSummary);
router.get('/inventory/summary', authorize('Admin', 'Receptionist'), getInventorySummary);
router.get('/patients/demographics', authorize('Admin', 'Receptionist', 'Doctor'), getPatientDemographics);
router.get('/detailed/doctors', authorize('Admin', 'Receptionist', 'Doctor'), getDoctorRegistry);
router.get('/detailed/patients', authorize('Admin', 'Receptionist', 'Doctor'), getDetailedPatients);
router.get('/detailed/inventory', authorize('Admin', 'Receptionist'), getDetailedInventory);
router.get('/detailed/billings', authorize('Admin', 'Receptionist', 'Doctor'), getDetailedBillings);
router.get('/detailed/appointments', authorize('Admin', 'Receptionist', 'Doctor'), getDetailedAppointments);
router.get('/doctors/performance', authorize('Admin'), getDoctorPerformance);
router.patch('/appointments/:id/status', authorize('Admin', 'Receptionist'), updateAppointmentStatus);
router.get('/saved', authorize('Admin'), getSavedReports);
router.post('/save', authorize('Admin'), saveReport);

export default router;
