import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
    createRecord,
    getPatientRecords,
    getRecordById,
    updateRecord,
    deleteRecord
} from '../controllers/emrController.js';

const router = express.Router();

// ─── Routes ────────────────────────────────────────────────────────────────

// Create record - (Doctor Only) includes single file attachment
router.post('/', protect, authorize('Doctor'), upload.single('attachment'), createRecord);

// Get specific patient's record library - (Admin, Doctor, or Patient owner)
router.get('/patient/:patientId', protect, authorize('Admin', 'Doctor', 'Patient'), getPatientRecords);

// Single record details
router.get('/:id', protect, authorize('Admin', 'Doctor', 'Patient'), getRecordById);

// Update - (Admin or the Doctor who created it)
router.put('/:id', protect, authorize('Admin', 'Doctor'), updateRecord);

// Delete - (Admin Only)
router.delete('/:id', protect, authorize('Admin'), deleteRecord);

export default router;
