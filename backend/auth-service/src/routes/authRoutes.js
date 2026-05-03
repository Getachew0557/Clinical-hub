import express from 'express';
import { register, login, getMe, updateMe, changePassword, getAllUsers, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect, authorize, optionalProtect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getAllUsers);
router.post('/register', optionalProtect, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, upload.single('profilePhoto'), updateMe);
router.patch('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

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
