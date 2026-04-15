import express from 'express';
import { register, login, getMe, updateMe, changePassword, getAllUsers, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect, authorize, optionalProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getAllUsers);
router.post('/register', optionalProtect, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
