import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

// ─── Public (authenticated) ───────────────────────────────────────────────

// Create: any authenticated user
router.post('/', protect, createAppointment);

// My appointments: any authenticated user sees their own
router.get('/my', protect, getMyAppointments);

// ─── Staff + Admin ────────────────────────────────────────────────────────

// All appointments: Admin & Receptionist only
router.get('/', protect, authorize('Admin', 'Receptionist'), getAllAppointments);

// Update status: Admin, Doctor, Receptionist
router.patch('/:id/status', protect, authorize('Admin', 'Doctor', 'Receptionist'), updateAppointmentStatus);

// ─── Per-appointment access (ownership checked inside controller) ──────────

// Get one: controller enforces ownership for Doctor/Patient
router.get('/:id', protect, getAppointmentById);

// Update/reschedule: controller enforces role-based field restrictions
router.put('/:id', protect, updateAppointment);

// Delete: Admin only
router.delete('/:id', protect, authorize('Admin'), deleteAppointment);

export default router;
