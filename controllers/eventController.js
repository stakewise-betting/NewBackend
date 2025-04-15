// controllers/eventController.js

import EventModel from "../models/event.js";
import NotificationModel from "../models/notification.js";
import User from "../models/userModel.js";
import { io } from "../server.js"; // Assuming io is correctly exported from server.js

export const createEvent = async (req, res) => {
    try {
        const eventData = req.body;
        // Validate required fields (optional but recommended)
        const requiredFields = ['eventId', 'name', 'description', 'rules', 'imageURL', 'startTime', 'endTime', 'options', 'notificationMessage', 'notificationImageURL'];
        for (const field of requiredFields) {
            if (!eventData[field]) {
                return res.status(400).json({ success: false, message: `Missing required field: ${field}` });
            }
        }
        if (!Array.isArray(eventData.options) || eventData.options.length < 2) {
             return res.status(400).json({ success: false, message: 'Event must have at least two options.' });
        }


        console.log("Received eventData for creation:", eventData);

        // Check if eventId already exists (optional, depends on if eventId should be unique in DB)
        const existingEvent = await EventModel.findOne({ eventId: eventData.eventId });
        if (existingEvent) {
            // Handle duplicate eventId - maybe return an error or update existing?
            // For now, let's log and potentially return error to prevent duplicates if desired
             console.warn(`Attempted to create event with duplicate eventId: ${eventData.eventId}`);
             // Option 1: Return error
             // return res.status(409).json({ success: false, message: `Event with ID ${eventData.eventId} already exists in the database.` });
             // Option 2: Allow creation (if eventId isn't strictly unique in DB schema) - current behavior
        }


        const newEvent = new EventModel({
            eventId: eventData.eventId,
            name: eventData.name,
            description: eventData.description,
            rules: eventData.rules,
            imageURL: eventData.imageURL,
            startTime: eventData.startTime, // Assuming frontend sends correct timestamp/parsable date
            endTime: eventData.endTime,   // Assuming frontend sends correct timestamp/parsable date
            options: eventData.options,
            notificationMessage: eventData.notificationMessage,
            notificationImageURL: eventData.notificationImageURL,
            // Add default values for fields not provided by frontend if needed
            category: eventData.category, // Make sure category is sent from frontend
            listedBy: eventData.listedBy || 'Admin', // Default or get from request
            volume: eventData.volume || 0, // Default volume
            isCompleted: eventData.isCompleted || false, // Default status
            winningOption: eventData.winningOption || null, // Default winner
        });

        await newEvent.save();
        console.log('Event saved to DB:', newEvent._id); // Log MongoDB document ID

        // --- Notification Logic ---
        const users = await User.find({}, "_id"); // Get only user IDs
        if (users && users.length > 0) {
            const newNotification = new NotificationModel({
                userIds: users.map(user => user._id),
                message: `New Event: ${eventData.name}. ${eventData.notificationMessage}`, // More descriptive message
                image: eventData.notificationImageURL,
                relatedEventId: newEvent._id // Link notification to the DB event doc ID (optional)
            });

            await newNotification.save();
            console.log("Notification saved to DB:", newNotification._id);

            // Emit via Socket.IO
            users.forEach(user => {
                 // Ensure user._id is valid before emitting
                 if (user && user._id) {
                    io.to(user._id.toString()).emit("new_notification", {
                        message: `New Event: ${eventData.name}. ${eventData.notificationMessage}`,
                        image: eventData.notificationImageURL,
                        eventId: eventData.eventId // Send numeric blockchain event ID if needed by client
                    });
                 }
            });
             console.log(`Emitted notifications to ${users.length} potential users.`);
        } else {
            console.log("No users found to notify.");
        }
        // --- End Notification Logic ---

        res.status(201).json({ success: true, message: 'Event created and notifications potentially sent!', eventId: newEvent.eventId }); // Return saved eventId

    } catch (error) {
        console.error('Error creating event:', error);
        // Provide more specific error message if possible (e.g., validation error)
        res.status(500).json({ success: false, message: 'Failed to save event', error: error.message }); // Send only error message
    }
};


// --- Controller to GET an event by its numeric eventId ---
export const getEventById = async (req, res) => {
  try {
    const eventIdParam = req.params.id; // Get id from the URL (e.g., the '1' in /api/events/1)
    const eventIdNum = parseInt(eventIdParam, 10); // Convert it to a number

    // Check if the conversion resulted in a valid number
    if (isNaN(eventIdNum)) {
       console.log(`Received invalid event ID format: ${eventIdParam}`);
       return res.status(400).json({ success: false, message: 'Invalid event ID format. ID must be a number.' });
    }

    console.log(`Attempting to fetch event metadata for eventId: ${eventIdNum}`);
    // Query the database for an event where the 'eventId' field matches the number
    // Ensure your EventModel schema has an index on 'eventId' for performance
    const event = await EventModel.findOne({ eventId: eventIdNum });

    if (!event) {
      // If no event is found in your MongoDB with that eventId, return 404
      console.log(`Event metadata not found in database for eventId: ${eventIdNum}`);
      return res.status(404).json({ success: false, message: 'Event metadata not found in database' });
    }

    // If found, send the event data back
    console.log(`Found event metadata for eventId: ${eventIdNum}`);
    res.status(200).json(event); // Send the full event document from DB

  } catch (error) {
    // Handle potential server errors during database query
    console.error(`Error fetching event metadata for ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error fetching event metadata', error: error.message });
  }
};

// --- Add other event-related controller functions below if needed ---
// export const getAllEvents = async (req, res) => { ... };
// export const updateEvent = async (req, res) => { ... };
// export const deleteEvent = async (req, res) => { ... };