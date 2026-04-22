import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    approveAppointment,
    updateAppointment,
    deleteAppointment,
    getAvailability,
    getStatusCounts
} from '../controllers/appointmentController.js';

const router = express.Router();

// Create: any authenticated user — optional file attachment
router.post('/', protect, upload.single('attachment'), createAppointment);

// My appointments: any authenticated user sees their own
router.get('/my', protect, getMyAppointments);

// Status counts: Doctor (own), Admin/Receptionist (all) — MUST be before /:id
router.get('/status-counts', protect, authorize('Admin', 'Receptionist', 'Doctor'), getStatusCounts);

// Availability: public — no auth required so unauthenticated patients can browse slots
router.get('/availability/:doctorId', getAvailability);

// ─── Staff + Admin ────────────────────────────────────────────────────────

// All appointments: Admin, Receptionist, Doctor
router.get('/', protect, authorize('Admin', 'Receptionist', 'Doctor'), getAllAppointments);

// Update status: Admin, Doctor, Receptionist
router.patch('/:id/status', protect, authorize('Admin', 'Doctor', 'Receptionist'), updateAppointmentStatus);

// Approve: Admin & Receptionist only
router.patch('/:id/approve', protect, authorize('Admin', 'Receptionist'), approveAppointment);

// ─── Per-appointment access (ownership checked inside controller) ──────────

// Get one: controller enforces ownership for Doctor/Patient
router.get('/:id', protect, getAppointmentById);

// Update/reschedule: controller enforces role-based field restrictions
router.put('/:id', protect, updateAppointment);

// Delete: Admin only
router.delete('/:id', protect, authorize('Admin'), deleteAppointment);

export default router;
