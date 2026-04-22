import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`📧 [Simulated Email] To: ${to}, Subject: ${subject}`);
        return true;
    }
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({ from: `"Clinical Hub" <${process.env.SMTP_USER}>`, to, subject, text, html });
        console.log(`📧 Email sent to: ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        return false;
    }
};

const sendSMS = async ({ to, message }) => {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        console.log(`📱 [Simulated SMS] To: ${to}, Message: ${message}`);
        return true;
    }
    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });
        console.log(`📱 SMS sent to: ${to}`);
        return true;
    } catch (error) {
        console.error('❌ SMS failed:', error.message);
        return false;
    }
};

export const handleUserRegistered = async (data) => {
    try {
        const { userId, fullName, email, phone } = data;
        if (!userId || !fullName) { console.error('❌ Malformed user.registered event:', data); return; }

        await Notification.create({
            userId,
            title: 'Welcome to Clinical Hub!',
            message: `Hello ${fullName}, thank you for joining our clinic. We're glad to have you!`,
            type: 'System',
            isRead: false,
            link: '/profile'
        });

        await sendEmail({
            to: email,
            subject: 'Welcome to Clinical Hub!',
            text: `Hi ${fullName},\n\nWelcome to Clinical Hub!`,
            html: `<h3>Welcome to Clinical Hub!</h3><p>Hi ${fullName}, your account is ready.</p>`
        });

        if (phone) {
            await sendSMS({ to: phone, message: `Hi ${fullName}, welcome to Clinical Hub! Your account is active.` });
        }

        console.log(`✅ Welcome flow completed for userId ${userId}`);
    } catch (error) {
        console.error('❌ Error handling user.registered event:', error.message);
    }
};
