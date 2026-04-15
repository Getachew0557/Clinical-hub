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

// Create Notification (Any authenticated user or internal service)
// The appointment/billing services forward the user's JWT when creating notifications
router.post('/', protect, createNotification);

export default router;
