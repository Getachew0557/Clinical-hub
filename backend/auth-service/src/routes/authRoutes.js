import express from 'express';
import { register, login, getMe, updateMe, changePassword, getAllUsers } from '../controllers/authController.js';
import { protect, authorize, optionalProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getAllUsers);

router.post('/register', optionalProtect, register);

// In a more robust way, we might want to use a custom middleware that doesn't fail if no token
// but for now, the controller check (if req.user exists) should suffice if we call it correctly.
// Actually, let's just make register public and handle the check inside.

router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/change-password', protect, changePassword);

export default router;
