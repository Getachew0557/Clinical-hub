import PatientProfile from '../models/PatientProfile.js';

/**
 * Handle user.registered event
 * Creates a skeleton patient profile asynchronously
 */
export const handleUserRegistered = async (data) => {
    try {
        const { userId, fullName, email } = data;

        if (!userId || !fullName || !email) {
            console.error('❌ Malformed user.registered event data:', data);
            return;
        }

        const existing = await PatientProfile.findOne({ where: { userId } });
        if (existing) {
            console.log(`ℹ️ Profile for userId ${userId} already exists. Skipping.`);
            return;
        }

        await PatientProfile.create({
            userId,
            fullName,
            email,
            isActive: true
        });

        console.log(`✅ [Async] Created patient profile for ${email}`);
    } catch (error) {
        console.error('❌ Error handling user.registered event:', error.message);
    }
};
