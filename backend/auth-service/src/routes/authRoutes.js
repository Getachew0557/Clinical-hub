import express from 'express';
import { register, login, getMe, updateMe, changePassword, getAllUsers, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect, authorize, optionalProtect } from '../middlewares/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getAllUsers);
router.post('/register', optionalProtect, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// One-time seed endpoint — creates admin if none exists
// Protected by a seed secret key
router.post('/seed-admin', async (req, res) => {
    try {
        const { seedKey } = req.body;
        if (seedKey !== process.env.SEED_SECRET) {
            return res.status(403).json({ message: 'Invalid seed key' });
        }

        const existing = await User.findOne({ where: { role: 'Admin' } });
        if (existing) {
            return res.status(200).json({ message: 'Admin already exists', email: existing.email });
        }

        const admin = await User.create({
            fullName: 'System Admin',
            email: 'admin@ras.dental',
            password: 'adminPassword123',
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
