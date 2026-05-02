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
        if (doctorId) where.doctorId = doctorId;
        if (patientId) where.patientId = patientId;
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
        const invoice = await Invoice.create({ patientId, doctorId, appointmentId, amount, description, dueDate });

        // Trigger Notification
        sendNotification(req, patientId, 'New Invoice', `A new invoice of ETB ${amount} has been generated for ${description}.`, '/billing', 'Warning');

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
