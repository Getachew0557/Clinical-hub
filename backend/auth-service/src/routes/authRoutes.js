import express from 'express';
import crypto from 'crypto';
import { register, login, getMe, updateMe, changePassword, getAllUsers, forgotPassword, resetPassword, refreshAccessToken, logout, googleAuth } from '../controllers/authController.js';
import { protect, authorize, optionalProtect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import User from '../models/User.js';
import { validateLogin, validateRegister, validatePasswordReset } from '../middlewares/validateMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getAllUsers);
router.post('/register', optionalProtect, validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.patch('/me', protect, upload.single('profilePhoto'), updateMe);
router.patch('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', validatePasswordReset, resetPassword);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.post('/google', googleAuth);

// ─── Account Deletion (GDPR right to be forgotten) ────────────────────────
router.delete('/delete-account', protect, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Require password confirmation (except Google-only accounts)
        if (user.password && password) {
            const valid = await user.comparePassword(password);
            if (!valid) return res.status(401).json({ message: 'Incorrect password' });
        } else if (!password) {
            return res.status(400).json({ message: 'Password confirmation required' });
        }

        // Anonymize instead of hard-delete to preserve referential integrity
        const anonId = `deleted_${Date.now()}`;
        await user.update({
            fullName: 'Deleted User',
            email: `${anonId}@deleted.invalid`,
            password: crypto.randomBytes(32).toString('hex'),
            profilePhoto: null,
            refreshToken: null,
            googleId: null,
            resetPasswordToken: null,
        });

        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Account deleted successfully. Your data has been anonymized.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// One-time seed endpoint — creates admin if none exists, or resets admin password
// Protected by a seed secret key
router.post('/seed-admin', async (req, res) => {
    try {
        const { seedKey } = req.body;
        if (seedKey !== process.env.SEED_SECRET) {
            return res.status(403).json({ message: 'Invalid seed key' });
        }

        let admin = await User.findOne({ where: { role: 'Admin' } });
        if (admin) {
            // Reset password to the canonical value
            admin.password = 'Abc@1221';
            await admin.save();
            return res.status(200).json({ message: 'Admin password reset', email: admin.email });
        }

        admin = await User.create({
            fullName: 'System Admin',
            email: 'admin@gmail.com',
            password: 'Abc@1221',
            role: 'Admin'
        });

        res.status(201).json({
            message: 'Admin created successfully',
            email: admin.email
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
