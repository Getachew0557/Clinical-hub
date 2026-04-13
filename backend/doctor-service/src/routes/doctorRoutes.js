import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    createDoctorProfile,
    getAllDoctors,
    getDoctorById,
    getMyProfile,
    updateDoctorProfile,
    toggleDoctorStatus,
    deleteDoctorProfile,
    getPublicDoctors
} from '../controllers/doctorController.js';

const router = express.Router();

// ─── Multer config (profile photo upload) ─────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `doctor-${unique}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
});

// ─── Public-ish (any authenticated user) ─────────────────────────────────

// Doctor fetches their own profile
router.get('/my-profile', protect, authorize('Doctor'), getMyProfile);

// ─── Admin & Receptionist ─────────────────────────────────────────────────

// Publicly list all doctors (for landing page) — no auth required
router.get('/public', getPublicDoctors);

// List all doctors (with optional search/filter)
router.get('/', protect, authorize('Admin', 'Receptionist', 'Doctor', 'Patient'), getAllDoctors);

// Create doctor profile — Admin only
router.post('/', protect, authorize('Admin'), upload.single('profilePhoto'), createDoctorProfile);

// Toggle active/inactive — Admin only
router.patch('/:id/status', protect, authorize('Admin'), toggleDoctorStatus);

// Delete — Admin only
router.delete('/:id', protect, authorize('Admin'), deleteDoctorProfile);

// ─── Per-profile (ownership checked inside controller) ───────────────────

// Get one by ID (Doctor: own only; Admin/Receptionist/Patient: any)
router.get('/:id', protect, authorize('Admin', 'Receptionist', 'Doctor', 'Patient'), getDoctorById);

// Update (Admin: all fields; Doctor: limited fields)
router.put('/:id', protect, authorize('Admin', 'Doctor'), upload.single('profilePhoto'), updateDoctorProfile);

export default router;
