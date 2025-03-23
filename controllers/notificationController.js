// controllers/notificationController.js
import { sendNotificationToClients } from "../services/websocketService.js";
import NotificationModel from "../models/notification.js";
import User from "../models/userModel.js";

// Send notification to all users
export const sendGenericNotification = async (req, res) => {
    try {
        const { message, notificationImageURL } = req.body;
        console.log('Received notification:', message, notificationImageURL);
        
        if (!message) {
            return res.status(400).send({ success: false, message: 'Notification message is required' });
        }
        
        // Get all users
        const users = await User.find({}, "_id");
        
        // Create notification in database
        const newNotification = new NotificationModel({
            userIds: users.map(user => user._id),
            message: message,
            image: notificationImageURL || null
        });
        
        await newNotification.save();
        
        // Send to all connected clients
        sendNotificationToClients({
            type: 'notification',
            message: message,
            notificationImageURL: notificationImageURL || null,
            id: newNotification._id.toString(),
            timestamp: newNotification.createdAt
        });
        
        res.status(200).send({
            success: true,
            message: 'Notification sent to all clients',
            notifications: [newNotification]
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send({ success: false, message: 'Failed to send notification', error: error.message });
    }
};

// Get notifications for a specific user
export const getNotifications = async (req, res) => {
    try {
        // Fix: Get userId from multiple possible sources
        let userId;
        
        // Try to get userId from different places in the request
        if (req.user && req.user._id) {
            userId = req.user._id;
        } else if (req.query && req.query.userId) {
            userId = req.query.userId;
        } else if (req.params && req.params.userId) {
            userId = req.params.userId;
        } else if (req.headers && req.headers['user-id']) {
            userId = req.headers['user-id'];
        } else if (req.cookies && req.cookies.userId) {
            userId = req.cookies.userId;
        }
        
        // Additional debug logging
        console.log('Request user object:', req.user);
        console.log('Extracted userId:', userId);
        
        if (!userId) {
            return res.status(401).send({ 
                success: false, 
                message: 'User not authenticated or user ID not found in request' 
            });
        }
        
        // Modified Query: Find notifications where userIds array includes the current userId
        const notifications = await NotificationModel.find({
            userIds: { $in: [userId] }
        }).sort({ createdAt: -1 }); // Sort by newest first
        
        console.log(`Found ${notifications.length} notifications for user ${userId}`);
        
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