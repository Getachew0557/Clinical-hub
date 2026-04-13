import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// ─── UTILITIES ──────────────────────────────────────────────────────────────

/**
 * Send an email using SMTP (Nodemailer)
 */
const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP credentials missing. Skipping email send (Simulator Mode).');
        console.log(`📧 [Simulated Email] To: ${to}, Subject: ${subject}`);
        return true;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Clinical Hub" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log(`📧 Email sent successfully to: ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
};

/**
 * Send an SMS using Twilio
 */
const sendSMS = async ({ to, message }) => {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.warn('⚠️ Twilio credentials missing. Skipping SMS send (Simulator Mode).');
        console.log(`📱 [Simulated SMS] To: ${to}, Message: ${message}`);
        return true;
    }

    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });

        console.log(`📱 SMS sent successfully to: ${to}`);
        return true;
    } catch (error) {
        console.error('❌ SMS sending failed:', error.message);
        return false;
    }
};


// ─── EVENT HANDLERS ─────────────────────────────────────────────────────────

/**
 * Handle user.registered event
 */
export const handleUserRegistered = async (data) => {
    try {
        const { userId, fullName, email, phone } = data;

        if (!userId || !fullName) {
            console.error('❌ Malformed user.registered event data:', data);
            return;
        }

        // 1. Create in-app notification
        await Notification.create({
            userId,
            title: 'Welcome to Clinical Hub!',
            message: `Hello ${fullName}, thank you for joining our clinic. We're glad to have you!`,
            type: 'System',
            isRead: false
        });

        // 2. Send Welcome Email
        await sendEmail({
            to: email,
            subject: 'Welcome to Clinical Hub!',
            text: `Hi ${fullName},\n\nWelcome to Clinical Hub! We're excited to help you manage your dental health.\n\nYou can now log in at http://localhost:3000 to book appointments and view your records.`,
            html: `<h3>Welcome to Clinical Hub!</h3><p>Hi ${fullName},</p><p>We're excited to help you manage your dental health. You can now log in to your portal to book appointments and view your records.</p>`
        });

        // 3. Send Welcome SMS if phone provided
        if (phone) {
            await sendSMS({
                to: phone,
                message: `Hi ${fullName}, welcome to Clinical Hub! Your account is active and ready for your first booking.`
            });
        }

        console.log(`✅ [Async] Full welcome flow completed for userId ${userId}`);
    } catch (error) {
        console.error('❌ Error handling user.registered event:', error.message);
    }
};

/**
 * Handle appointment.remind event (Planned for future use)
 */
export const handleAppointmentReminder = async (data) => {
    const { email, phone, patientName, date, time } = data;
    
    await sendEmail({
        to: email,
        subject: 'Appointment Reminder',
        text: `Hi ${patientName}, this is a reminder for your dental appointment on ${date} at ${time}.`
    });

    if (phone) {
        await sendSMS({
            to: phone,
            message: `Hi ${patientName}, reminder for your appointment on ${date} at ${time}. See you soon!`
        });
    }
};
