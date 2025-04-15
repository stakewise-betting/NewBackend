// routes/notificationRoutes.js
import express from "express";
// Import the new controller function
import { getNotifications, markNotificationsAsRead } from "../controllers/notificationController.js";

const router = express.Router();

// Existing route to get notifications
router.get('/', getNotifications);

// *** NEW ROUTE ***
// Route to mark notifications as read
router.post('/read', markNotificationsAsRead); // Use POST as it changes state

export default router;