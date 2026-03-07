import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    getAppointmentStats,
    getInventorySummary,
    getPatientDemographics,
    saveReport,
    getSavedReports
} from '../controllers/reportController.js';

const router = express.Router();

// ─── Routes (Admin Only) ──────────────────────────────────────────────────

router.use(protect);
router.use(authorize('Admin'));

router.get('/appointments/stats', getAppointmentStats);
router.get('/inventory/summary', getInventorySummary);
router.get('/patients/demographics', getPatientDemographics);

router.get('/saved', getSavedReports);
router.post('/save', saveReport);

export default router;
