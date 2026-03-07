import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    createPatientProfile,
    getAllPatients,
    getPatientById,
    getMyProfile,
    updatePatientProfile,
    togglePatientStatus,
    deletePatientProfile
} from '../controllers/patientController.js';

const router = express.Router();

// ─── Multer config ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `patient-${unique}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only images (jpeg, png, webp) allowed'));
    }
});

// ─── Routes ────────────────────────────────────────────────────────────────

// Any authenticated user can check their own profile
router.get('/my-profile', protect, getMyProfile);

// Management (Admin, Receptionist, Doctor)
router.get('/', protect, authorize('Admin', 'Receptionist', 'Doctor'), getAllPatients);

// Creation - Admin/Receptionist only
router.post('/', protect, authorize('Admin', 'Receptionist'), upload.single('profilePhoto'), createPatientProfile);

// Specific ID - (Admin/Staff any; Patient own only)
router.get('/:id', protect, authorize('Admin', 'Receptionist', 'Doctor', 'Patient'), getPatientById);

// Update - (Admin/Owner)
router.put('/:id', protect, authorize('Admin', 'Patient'), upload.single('profilePhoto'), updatePatientProfile);

// Admin Only
router.patch('/:id/status', protect, authorize('Admin'), togglePatientStatus);
router.delete('/:id', protect, authorize('Admin'), deletePatientProfile);

export default router;
