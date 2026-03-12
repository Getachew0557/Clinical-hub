import Notification from '../models/Notification.js';

/**
 * Handle user.registered event
 * Sends a welcome notification to the new user
 */
export const handleUserRegistered = async (data) => {
    try {
        const { userId, fullName, email } = data;

        if (!userId || !fullName) {
            console.error('❌ Malformed user.registered event data:', data);
            return;
        }

        // Create an in-app notification
        await Notification.create({
            userId,
            title: 'Welcome to Ras Dental!',
            message: `Hello ${fullName}, thank you for joining our clinic. We're glad to have you!`,
            type: 'System',
            isRead: false
        });

        // Simulate sending an Email/SMS
        console.log(`📧 [Async] Welcome Email sent to: ${email}`);
        console.log(`✅ [Async] Welcome Notification created for userId ${userId}`);
    } catch (error) {
        console.error('❌ Error handling user.registered event:', error.message);
    }
};
