/**
 * Simple request body validation middleware.
 * Uses plain JS — no extra dependencies needed.
 */
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const isValidEmail = (email) => EMAIL_REGEX.test(email);

/**
 * Checks if the email domain has valid MX records (i.e., can receive email).
 * Returns true if valid, false if the domain doesn't exist or has no MX records.
 * Falls back to true on DNS timeout/error to avoid blocking legitimate registrations.
 */
const hasMxRecord = async (email) => {
    try {
        const domain = email.split('@')[1];
        if (!domain) return false;
        const records = await Promise.race([
            resolveMx(domain),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        return Array.isArray(records) && records.length > 0;
    } catch (err) {
        // DNS lookup failed or timed out — allow registration to proceed
        // (avoids blocking users on slow DNS or private domains)
        console.warn(`[Validate] MX check failed for ${email}: ${err.message} — allowing registration`);
        return true;
    }
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    req.body.email = email.trim().toLowerCase();
    next();
};

export const validateRegister = async (req, res, next) => {
    const { fullName, email, password } = req.body;
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        return res.status(400).json({ message: 'Full name must be at least 2 characters' });
    }
    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Validate that the email domain can actually receive email (has MX records)
    const emailLower = email.trim().toLowerCase();
    const mxValid = await hasMxRecord(emailLower);
    if (!mxValid) {
        return res.status(400).json({
            message: `The email domain "${emailLower.split('@')[1]}" does not appear to be a valid email provider. Please use a real email address.`
        });
    }

    // Basic XSS prevention — strip HTML tags from string fields
    req.body.fullName = fullName.trim().replace(/<[^>]*>/g, '');
    req.body.email = emailLower;
    next();
};

export const validatePasswordReset = (req, res, next) => {
    const { token, newPassword } = req.body;
    if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Reset token is required' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    next();
};
