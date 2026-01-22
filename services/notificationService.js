const prisma = require('../utils/prisma');

/**
 * Create a notification for a user
 * @param {number} userId - The ID of the user to notify
 * @param {string} message - The notification message
 */
async function createNotification(userId, message) {
    try {
        await prisma.notification.create({
            data: {
                user_id: userId,
                message: message,
                is_read: false
            }
        });
        console.log(`[Notification] Created for user ${userId}: ${message}`);
    } catch (error) {
        console.error(`[Notification] Failed to create notification: ${error.message}`, error);
    }
}

module.exports = {
    createNotification
};