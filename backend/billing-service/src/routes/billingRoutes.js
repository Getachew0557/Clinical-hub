import express from 'express';
import { getPatientInvoices, createInvoice, processPayment, getAllInvoices } from '../controllers/billingController.js';

const router = express.Router();

router.get('/invoices', getAllInvoices);
router.get('/invoices/:patientId', getPatientInvoices);
router.post('/invoices', createInvoice);
router.post('/pay', processPayment);

export default router;
