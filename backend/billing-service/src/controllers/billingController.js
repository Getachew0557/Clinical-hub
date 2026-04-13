import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import axios from 'axios';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Get all invoices (Admin/Receptionist/Filtered)
export const getAllInvoices = async (req, res) => {
    try {
        const { doctorId, patientId, status } = req.query;
        let where = {};
        if (doctorId) where.doctorId = doctorId;
        if (patientId) where.patientId = patientId;
        if (status) where.status = status;

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

// Get all invoices for a patient
export const getPatientInvoices = async (req, res) => {
    try {
        const { patientId } = req.params;
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

// Create a new invoice
export const createInvoice = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentId, amount, description, dueDate } = req.body;
        const invoice = await Invoice.create({
            patientId,
            doctorId,
            appointmentId,
            amount,
            description,
            dueDate
        });

        // ─── TRIGGER NOTIFICATION ───
        try {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
            if (notifyUrl) {
                await axios.post(notifyUrl, {
                    userId: patientId,
                    title: 'New Invoice Generated',
                    message: `A new invoice of $${amount} has been generated for your recent visit.`,
                    type: 'info',
                    link: '/billing'
                }, authHeader).catch(err => console.error('Invoice Notify Error:', err.message));
            }
        } catch (err) {
            console.error('Invoice Notification Trigger Failed:', err.message);
        }

        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Process payment via Stripe (with simulator fallback)
 */
export const processPayment = async (req, res) => {
    try {
        const { invoiceId, amount, method } = req.body;

        const invoice = await Invoice.findByPk(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        let transactionRef = `SIM-${Date.now()}`;
        let status = 'Success';
        let paymentIntent = null;

        // ─── STRIPE INTEGRATION ───
        if (stripe) {
            try {
                // Create a PaymentIntent
                paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100), // Stripe uses cents
                    currency: 'usd',
                    metadata: { invoiceId, patientId: invoice.patientId },
                    automatic_payment_methods: { enabled: true },
                });
                transactionRef = paymentIntent.id;
                // Note: In a real frontend flow, the client would use the client_secret to complete payment.
                // We'll mark it as 'Pending' in the DB until a webhook confirms it.
                // For this demo, we'll proceed as Success if Stripe didn't error.
            } catch (stripeErr) {
                console.warn('Stripe Integration Error, falling back to simulator:', stripeErr.message);
            }
        }

        const payment = await Payment.create({
            invoiceId,
            amount,
            method: stripe ? 'Stripe' : (method || 'Free Simulator'),
            transactionReference: transactionRef,
            status: status,
            rawData: paymentIntent ? JSON.stringify(paymentIntent) : null
        });

        // Update invoice status
        invoice.status = 'Paid';
        await invoice.save();

        // ─── TRIGGER NOTIFICATION ───
        try {
            const authHeader = { headers: { Authorization: req.headers.authorization } };
            const notifyUrl = process.env.NOTIFICATION_SERVICE_URL;
            if (notifyUrl) {
                await axios.post(notifyUrl, {
                    userId: invoice.patientId,
                    title: 'Payment Successful',
                    message: `Thank you! Your payment of $${amount} for invoice #${invoice.id.slice(-6)} was successful.`,
                    type: 'success',
                    link: '/billing'
                }, authHeader).catch(err => console.error('Payment Notify Error:', err.message));
            }
        } catch (err) {
            console.error('Payment Notification Trigger Failed:', err.message);
        }

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
