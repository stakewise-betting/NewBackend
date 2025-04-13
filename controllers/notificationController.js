// controllers/notificationController.js
import { sendNotificationToClients } from "../services/websocketService.js";
import NotificationModel from "../models/notification.js";
import User from "../models/userModel.js";

// Helper function to extract User ID (keep it DRY)
const getUserIdFromRequest = (req) => {
    if (req.user && req.user._id) return req.user._id;
    if (req.headers && req.headers['user-id']) return req.headers['user-id'];
    if (req.query && req.query.userId) return req.query.userId;
    if (req.params && req.params.userId) return req.params.userId;
    if (req.cookies && req.cookies.userId) return req.cookies.userId;
    return null;
};

// Get notifications for a specific user
export const getNotifications = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        console.log('Request user object:', req.user); // Keep for debugging if needed
        console.log('Extracted userId for getNotifications:', userId);

        if (!userId) {
            return res.status(401).send({
                success: false,
                message: 'User not authenticated or user ID not found in request'
            });
        }

        // Find notifications where userIds array includes the current userId
        const notificationsFromDb = await NotificationModel.find({
            userIds: { $in: [userId] }
        }).sort({ createdAt: -1 }); // Sort by newest first

        console.log(`Found ${notificationsFromDb.length} raw notifications for user ${userId}`);

        // *** MODIFICATION START ***
        // Add the 'read' status specific to the requesting user
        const notifications = notificationsFromDb.map(notif => {
            const plainNotif = notif.toObject(); // Convert Mongoose doc to plain object
            // Use the model method to check read status for *this* user
            plainNotif.read = notif.isReadByUser(userId);
            // Keep the original _id as id for frontend convenience
            plainNotif.id = plainNotif._id;
             // Ensure necessary fields are present (handle potential missing data)
             plainNotif.message = plainNotif.message || "Notification content missing.";
             plainNotif.notificationImageURL = plainNotif.image || plainNotif.notificationImageURL; // Check both possible names
             plainNotif.timestamp = plainNotif.createdAt ? new Date(plainNotif.createdAt).getTime() : Date.now();
             plainNotif.eventId = plainNotif.eventId || null;
            // Optionally remove the complex 'read' Map if you don't want to expose it
            // delete plainNotif.read; // -> We keep the original `read` map field name but populate it with the boolean
            return plainNotif;
        });
        // *** MODIFICATION END ***

        console.log(`Processed ${notifications.length} notifications with read status for user ${userId}`);

        res.status(200).send({ success: true, notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
};


// *** NEW CONTROLLER FUNCTION ***
// Mark specific notifications as read for a user
export const markNotificationsAsRead = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        console.log('Extracted userId for markNotificationsAsRead:', userId);


        if (!userId) {
            return res.status(401).send({ success: false, message: 'User not authenticated or user ID not found' });
        }

        const { notificationIds } = req.body;

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            // It's okay if the array is empty, just means nothing to mark
             console.log(`Received request to mark notifications read for user ${userId}, but no IDs were provided.`);
             return res.status(200).send({ success: true, message: 'No notifications to mark as read.', markedCount: 0 });
            // return res.status(400).send({ success: false, message: 'Invalid or empty notificationIds array provided' });
        }

        console.log(`Attempting to mark ${notificationIds.length} notifications as read for user ${userId}:`, notificationIds);


        // Use updateMany for efficiency.
        // Condition: Document ID is in the list AND the user is in the userIds array
        // Update: Set the read status for this specific user to true in the 'read' map.
        const updateResult = await NotificationModel.updateMany(
           { _id: { $in: notificationIds }, userIds: { $in: [userId] } },
           { $set: { [`read.${userId}`]: true } } // Use Mongoose's dot notation to update map field
        );

        console.log(`Update result for marking notifications read for user ${userId}: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);


        // Note: updateResult.modifiedCount might be less than notificationIds.length
        // if some notifications were already marked read or didn't belong to the user.

        res.status(200).send({
            success: true,
            message: `Successfully processed request to mark notifications as read for user ${userId}.`,
            markedCount: updateResult.modifiedCount // Send back how many were actually updated
        });

    } catch (error) {
        console.error(`Error marking notifications as read for user ${userId}:`, error);
        res.status(500).send({
            success: false,
            message: 'Failed to mark notifications as read',
            error: error.message
        });
    }
};