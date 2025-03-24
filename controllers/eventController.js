import EventModel from "../models/event.js";
import NotificationModel from "../models/notification.js";
import User from "../models/userModel.js";
import { io } from "../server.js"; // ✅ Correct import, no need to pass io as a parameter

export const createEvent = async (req, res) => {
    try {
        const eventData = req.body;
        const users = await User.find({}, "_id"); // Get only user IDs

        console.log("Received eventData:", eventData);

        const newEvent = new EventModel({
            eventId: eventData.eventId,
            name: eventData.name,
            description: eventData.description,
            rules: eventData.rules,
            imageURL: eventData.imageURL,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            options: eventData.options,
            notificationMessage: eventData.notificationMessage,
            notificationImageURL: eventData.notificationImageURL
        });

        await newEvent.save();
        console.log('Event saved:', newEvent);

        // ✅ Insert ONE notification for ALL users
        const newNotification = new NotificationModel({
            userIds: users.map(user => user._id), // ✅ Store all user IDs in one document
            message: eventData.notificationMessage || "Default notification message",
            image: eventData.notificationImageURL
        });

        await newNotification.save();
        console.log("Notification saved:", newNotification);

        // ✅ Emit notification to all users
        users.forEach(user => {
            io.to(user._id.toString()).emit("new_notification", `New Event: ${eventData.notificationMessage}`);
        });

        res.status(201).json({ success: true, message: 'Event created and notifications sent!', eventId: eventData.eventId });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save event', error });
    }
};