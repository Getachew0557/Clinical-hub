import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Helper to send notifications
const sendNotification = async (req, userId, title, message, link, type = 'info') => {
    try {
        const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
        if (!notifyUrl) return;

        await axios.post(notifyUrl, {
            userId,
            title,
            message,
            type,
            link
        }, {
            headers: { Authorization: req.headers.authorization }
        });
    } catch (err) {
        console.error('Notification Trigger Error:', err.message);
    }
};

export const getAllInvoices = async (req, res) => {
    try {
        const { doctorId, patientId, status, appointmentId } = req.query;
        let where = {};
        
        if (req.user.role === 'Patient') {
            where.patientId = req.user.id;
        } else {
            if (patientId) where.patientId = patientId;
        }

        if (doctorId) where.doctorId = doctorId;
        if (status) where.status = status;
        if (appointmentId) where.appointmentId = appointmentId;

        const invoices = await Invoice.findAll({
            where,
            include: [{ model: Payment, as: 'payments' }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPatientInvoices = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Ownership check: Patient can only see their own invoices
        if (req.user.role === 'Patient' && req.user.id !== patientId) {
            return res.status(403).json({ message: 'Not authorized to view these invoices' });
        }

        const invoices = await Invoice.findAll({
            where: { patientId },
            include: [{ model: Payment, as: 'payments' }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createInvoice = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentId, amount, description, dueDate } = req.body;
        const numericAmount = Number(amount);
        const status = numericAmount === 0 ? 'Paid' : 'Pending';
        const invoice = await Invoice.create({ patientId, doctorId, appointmentId, amount: numericAmount, description, dueDate, status });

        // Trigger Notification
        if (numericAmount > 0) {
            sendNotification(req, patientId, 'New Invoice', `A new invoice of ETB ${numericAmount} has been generated for ${description}.`, '/billing', 'Warning');
        } else {
            sendNotification(req, patientId, 'Free Consultation', `A free consultation session has been confirmed. No payment is required.`, '/appointments', 'Success');
        }

        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const processPayment = async (req, res) => {
    try {
        const { invoiceId, amount, method } = req.body;

        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Ownership check: Patient can only pay their own invoices
        if (req.user.role === 'Patient' && req.user.id !== invoice.patientId) {
            return res.status(403).json({ message: 'Not authorized to pay this invoice' });
        }

        // Idempotency: don't double-pay
        if (invoice.status === 'Paid') {
            return res.status(400).json({ message: 'Invoice is already paid' });
        }

        let transactionRef = `SIM-${Date.now()}`;
        let paymentIntent = null;

        if (stripe) {
            try {
                paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100),
                    currency: 'usd',
                    metadata: { invoiceId, patientId: invoice.patientId },
                    automatic_payment_methods: { enabled: true },
                });
                transactionRef = paymentIntent.id;
            } catch (stripeErr) {
                console.warn('Stripe fallback to simulator:', stripeErr.message);
            }
        }

        const payment = await Payment.create({
            invoiceId,
            amount,
            method: stripe ? 'Stripe' : (method || 'Free Simulator'),
            transactionReference: transactionRef,
            status: 'Success',
            rawData: paymentIntent ? JSON.stringify(paymentIntent) : null
        });

        invoice.status = 'Paid';
        await invoice.save();

        res.status(200).json({
            message: 'Payment processed successfully',
            payment,
            invoice,
            clientSecret: paymentIntent?.client_secret
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── NEW: Manual Payment Proof Workflow ───────────────────────────────────────

export const submitPaymentProof = async (req, res) => {
    try {
        const { invoiceId, amount, method } = req.body;
        const proofUrl = req.file ? `uploads/${req.file.filename}` : null;

        if (!proofUrl) {
            return res.status(400).json({ message: 'Payment proof image is required' });
        }

        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Prevent duplicate pending submissions
        const existingPending = await Payment.findOne({
            where: { invoiceId, status: 'Pending' }
        });
        if (existingPending) {
            return res.status(400).json({ message: 'A payment proof is already under review for this invoice' });
        }

        // Create a Pending payment record
        const payment = await Payment.create({
            invoiceId,
            amount: amount || invoice.amount,
            method: method || 'Bank Transfer',
            status: 'Pending',
            proofUrl
        });

        // Notify patient that proof is submitted
        sendNotification(req, invoice.patientId,
            'Payment Proof Submitted',
            `Your payment receipt for ETB ${invoice.amount} has been submitted and is awaiting admin approval. You will be notified once approved.`,
            '/billing', 'Info');

        res.status(201).json({ message: 'Payment proof submitted for review', payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const approvePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findByPk(paymentId, {
            include: [{ model: Invoice }]
        });

        if (!payment) return res.status(404).json({ message: 'Payment record not found' });
        if (payment.status === 'Success') return res.status(400).json({ message: 'Payment is already approved' });

        // Update payment status
        payment.status = 'Success';
        await payment.save();

        // Update invoice status — use the associated Invoice
        const invoice = await Invoice.findByPk(payment.invoiceId);
        if (invoice) {
            invoice.status = 'Paid';
            await invoice.save();
            // Notify patient
            sendNotification(req, invoice.patientId, 'Payment Approved ✓',
                `Your payment of ETB ${payment.amount} has been approved. You can now join your video session.`,
                '/video-consultations', 'Success');
        }

        res.status(200).json({ message: 'Payment approved successfully', payment, invoice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const rejectPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;
        const payment = await Payment.findByPk(paymentId);

        if (!payment) return res.status(404).json({ message: 'Payment record not found' });

        payment.status = 'Failed';
        payment.rawData = JSON.stringify({ rejectionReason: reason || 'Invalid proof' });
        await payment.save();

        const invoice = await Invoice.findByPk(payment.invoiceId);
        if (invoice) {
            sendNotification(req, invoice.patientId, 'Payment Rejected',
                `Your payment proof was rejected. Reason: ${reason || 'Please upload a valid receipt'}. Please resubmit.`,
                '/billing', 'Error');
        }

        res.status(200).json({ message: 'Payment rejected', payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
