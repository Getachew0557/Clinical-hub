import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { getAllInvoices, getPatientInvoices, createInvoice, processPayment } from '../controllers/billingController.js';

const router = express.Router();

// All billing routes require authentication
router.use(protect);

router.get('/invoices', authorize('Admin', 'Receptionist', 'Doctor'), getAllInvoices);
router.get('/invoices/:patientId', getPatientInvoices);  // Patient can see own, staff can see any
router.post('/invoices', authorize('Admin', 'Receptionist', 'Doctor'), createInvoice);
router.post('/pay', processPayment);

export default router;
