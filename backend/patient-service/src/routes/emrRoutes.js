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

router.post('/', protect, authorize('Doctor'), upload.single('attachment'), createRecord);
router.get('/patient/:patientId', protect, authorize('Admin', 'Doctor', 'Patient'), getPatientRecords);
router.get('/:id', protect, authorize('Admin', 'Doctor', 'Patient'), getRecordById);
router.put('/:id', protect, authorize('Admin', 'Doctor'), updateRecord);
router.delete('/:id', protect, authorize('Admin'), deleteRecord);

export default router;
