import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { 
    getAllInvoices, getPatientInvoices, createInvoice, 
    processPayment, submitPaymentProof, approvePayment, rejectPayment 
} from '../controllers/billingController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// All billing routes require authentication
router.use(protect);

router.get('/invoices', getAllInvoices);
router.get('/invoices/:patientId', getPatientInvoices);
router.post('/invoices', authorize('Admin', 'Receptionist', 'Doctor'), createInvoice);
router.post('/pay', processPayment);

// Manual proof workflow
router.post('/submit-proof', upload.single('proof'), submitPaymentProof);
router.patch('/approve/:paymentId', authorize('Admin', 'Receptionist'), approvePayment);
router.patch('/reject/:paymentId', authorize('Admin', 'Receptionist'), rejectPayment);

export default router;
