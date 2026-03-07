import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
    getMyNotifications,
    createNotification,
    markAsRead,
    markAllRead,
    deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// ─── Routes ────────────────────────────────────────────────────────────────

// Get my notifications (All Users)
router.get('/my', protect, getMyNotifications);

// Management
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);

// Create Notification (Admin / Internal Service usage)
router.post('/', protect, authorize('Admin'), createNotification);

export default router;
