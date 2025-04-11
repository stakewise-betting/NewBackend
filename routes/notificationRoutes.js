// routes/notificationRoutes.js
import express from "express";
import { sendGenericNotification, getNotifications } from "../controllers/notificationController.js"; // Updated import

const router = express.Router();

router.post('/send', sendGenericNotification);
router.get('/', getNotifications); // GET route for fetching notifications - using getNotifications

export default router;