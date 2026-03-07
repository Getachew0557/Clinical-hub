import Notification from '../models/Notification.js';

/**
 * Get notifications for the logged-in user
 */
export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ count: notifications.length, notifications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Create a new notification (Internal/Admin only)
 * Usually called by other services when events occur
 */
export const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, link } = req.body;

        const notification = await Notification.create({
            userId, title, message, type, link
        });

        res.status(201).json({ message: 'Notification created', notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Mark all as read
 */
export const markAllRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { userId: req.user.id, isRead: false } }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
    try {
        const result = await Notification.destroy({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!result) return res.status(404).json({ message: 'Notification not found' });

        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
