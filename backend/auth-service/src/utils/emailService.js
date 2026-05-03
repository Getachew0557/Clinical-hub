import nodemailer from 'nodemailer';

// Create transporter — uses SMTP env vars, falls back to Ethereal (dev)
let transporter = null;

const getTransporter = async () => {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Dev: use Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        console.log('[Email] Using Ethereal test account:', testAccount.user);
    }
    return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const t = await getTransporter();
        const info = await t.sendMail({
            from: `"Biruh Tena Clinic" <${process.env.SMTP_USER || 'noreply@biruhtena.com'}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]+>/g, ''),
        });
        console.log(`[Email] Sent to ${to}: ${subject} (${info.messageId})`);
        return info;
    } catch (err) {
        console.error('[Email] Failed to send:', err.message);
        // Non-fatal — don't throw
    }
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
    return sendEmail({
        to: email,
        subject: 'Reset Your Biruh Tena Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">Password Reset Request</h2>
                <p>You requested a password reset for your Biruh Tena account.</p>
                <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                    Reset Password
                </a>
                <p style="color:#64748b;font-size:14px;">If you didn't request this, please ignore this email.</p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;">Biruh Tena Clinical Hub — ብሩህ ጤና</p>
            </div>
        `,
    });
};

export const sendWelcomeEmail = async (email, fullName, role) => {
    return sendEmail({
        to: email,
        subject: 'Welcome to Biruh Tena Clinical Hub',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">Welcome, ${fullName}! 👋</h2>
                <p>Your ${role} account has been created on Biruh Tena Clinical Hub.</p>
                <p>You can now log in and ${role === 'Patient' ? 'book appointments with our doctors' : 'access your dashboard'}.</p>
                <a href="${process.env.FRONTEND_URL || 'https://bruhtena.vercel.app'}/login" style="display:inline-block;background:#0d9488;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                    Go to Login
                </a>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;">Biruh Tena Clinical Hub — ብሩህ ጤና</p>
            </div>
        `,
    });
};

export const sendAppointmentConfirmationEmail = async (email, patientName, doctorName, date, time, type) => {
    const isVideo = type === 'video';
    return sendEmail({
        to: email,
        subject: `Appointment Confirmed — ${date} at ${time}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0d9488;">Appointment Confirmed ✓</h2>
                <p>Dear ${patientName},</p>
                <p>Your ${isVideo ? 'video consultation' : 'clinic appointment'} with <strong>Dr. ${doctorName}</strong> has been confirmed.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
                    <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
                    <p style="margin:4px 0;"><strong>Time:</strong> ${time}</p>
                    <p style="margin:4px 0;"><strong>Type:</strong> ${isVideo ? '📹 Video Consultation' : '🏥 Clinic Visit'}</p>
                </div>
                ${isVideo ? '<p>You will receive a link to join the video session when the doctor is ready.</p>' : '<p>Please arrive 10 minutes early at the clinic.</p>'}
                <a href="${process.env.FRONTEND_URL || 'https://bruhtena.vercel.app'}/appointments" style="display:inline-block;background:#0d9488;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                    View Appointment
                </a>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="color:#94a3b8;font-size:12px;">Biruh Tena Clinical Hub — ብሩህ ጤና</p>
            </div>
        `,
    });
};
