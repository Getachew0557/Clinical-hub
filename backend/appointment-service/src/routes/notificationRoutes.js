import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
    getMyNotifications,
    createNotification,
    markAsRead,
    markAllRead,
    deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/my', protect, getMyNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);
router.post('/', protect, createNotification);

// Internal endpoint — no auth required (called by other services on same host)
router.post('/internal', createNotification);

export default router;
