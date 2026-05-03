/**
 * Simple request body validation middleware.
 * Uses plain JS — no extra dependencies needed.
 */

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const isValidEmail = (email) => EMAIL_REGEX.test(email);

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

export const validateRegister = (req, res, next) => {
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
    // Basic XSS prevention — strip HTML tags from string fields
    req.body.fullName = fullName.trim().replace(/<[^>]*>/g, '');
    req.body.email = email.trim().toLowerCase();
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
