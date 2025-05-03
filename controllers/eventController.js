// controllers/eventController.js
import EventModel from "../models/event.js";
import NotificationModel from "../models/notification.js";
import User from "../models/userModel.js";
import { io } from "../server.js";

// --- Controller to CREATE an event ---
export const createEvent = async (req, res) => {
    try {
        const eventData = req.body;
        // Validate required fields (optional but recommended)
        const requiredFields = ['eventId', 'name', 'description', 'rules', 'imageURL', 'startTime', 'endTime', 'options', 'notificationMessage', 'notificationImageURL', 'category']; // Added category "Bhashitha"
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

        // Ensure timestamps are numbers (Unix epoch seconds)
        const startTimeNum = Number(eventData.startTime);
        const endTimeNum = Number(eventData.endTime);

        if (isNaN(startTimeNum) || isNaN(endTimeNum)) {
            return res.status(400).json({ success: false, message: 'startTime and endTime must be valid numbers (Unix timestamps).' });
        }

        // Create new event instance using the Mongoose model
        const newEvent = new EventModel({
            eventId: eventData.eventId,
            name: eventData.name,
            description: eventData.description,
            rules: eventData.rules,
            imageURL: eventData.imageURL,
            startTime: startTimeNum, // Store as number
            endTime: endTimeNum,     // Store as number
            options: eventData.options,
            notificationMessage: eventData.notificationMessage,
            notificationImageURL: eventData.notificationImageURL,
            category: eventData.category, // Store category
            // Add default values or get from request if needed
            // createdAt will be added automatically by default: Date.now
            listedBy: eventData.listedBy || 'Admin', // Default or get from request
            volume: eventData.volume || 0, // Default volume
            isCompleted: eventData.isCompleted || false, // Default status
            winningOption: eventData.winningOption || null, // Default winner
        });

        // Save the new event to MongoDB
        await newEvent.save();
        console.log('Event saved to DB:', newEvent._id, 'with eventId:', newEvent.eventId);

        // --- Notification Logic (Optional - Uncomment and adapt if needed) ---
        /*
        const users = await User.find({}, "_id");
        if (users && users.length > 0) {
            const newNotification = new NotificationModel({
                userIds: users.map(user => user._id),
                message: `New Event: ${eventData.notificationMessage}`,
                image: eventData.notificationImageURL,
                relatedEventId: newEvent._id // Link to DB ID
            });
            await newNotification.save();
            console.log("Notification saved:", newNotification._id);

            users.forEach(user => {
                 if (user && user._id) {
                    io.to(user._id.toString()).emit("new_notification", {
                        message: `New Event: ${eventData.notificationMessage}`,
                        image: eventData.notificationImageURL,
                        eventId: newEvent.eventId // Send numeric blockchain ID
                    });
                 }
            });
             console.log(`Emitted notifications to ${users.length} potential users.`);
        } else {
            console.log("No users found to notify.");
        }
        */
        // --- End Notification Logic ---

        // Respond with success and the created event's ID
        res.status(201).json({ success: true, message: 'Event created successfully!', eventId: newEvent.eventId });

    } catch (error) {
        console.error('!!! Error creating event:', error);
        // Handle potential errors (e.g., validation errors, database connection issues)
        if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ success: false, message: 'Failed to save event', error: error.message });
    }
};


// --- Controller to GET a single event by its numeric eventId ---
export const getEventById = async (req, res) => {
  try {
    const eventIdParam = req.params.id;
    const eventIdNum = parseInt(eventIdParam, 10);

    if (isNaN(eventIdNum)) {
       console.log(`Received invalid event ID format for lookup: ${eventIdParam}`);
       return res.status(400).json({ success: false, message: 'Invalid event ID format. ID must be a number.' });
    }

    console.log(`Attempting to fetch event metadata from DB for eventId: ${eventIdNum}`);
    // Find the event in MongoDB using the numeric eventId
    const event = await EventModel.findOne({ eventId: eventIdNum });

    if (!event) {
      // If no event is found in your MongoDB with that eventId, return 404
      console.log(`Event metadata not found in database for eventId: ${eventIdNum}`);
      return res.status(404).json({ success: false, message: 'Event metadata not found in database' });
    }

    console.log(`Found event metadata for eventId: ${eventIdNum}`);
    // Return the full event document found in the database
    res.status(200).json(event);

  } catch (error) {
    // Handle potential server errors during database query
    console.error(`!!! Error fetching event metadata for ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Server error fetching event metadata', error: error.message });
  }
};


// --- Controller to SEARCH/FILTER events ---
export const searchEvents = async (req, res) => {
  try {
      // Destructure 'keywords' instead of 'categories'
      const { searchTerm, keywords, new: isNew } = req.query;
      const currentTimeSeconds = Math.floor(Date.now() / 1000);

      console.log("Received search request with query:", req.query);

      // Initialize filter criteria with base time filter
      let filterCriteria = {
           startTime: { $lte: Number(currentTimeSeconds) },
      };

      // --- Build Combined Search Logic ---
      const searchConditions = []; // Array to hold all search-related $or conditions

      // 1. Add conditions for the main 'searchTerm' (if provided)
      if (searchTerm) {
          const regexSearch = new RegExp(searchTerm, 'i');
          // searchTerm must match name OR options
          searchConditions.push({
              $or: [
                  { name: regexSearch },
                  { options: regexSearch }
              ]
          });
          console.log("Applying searchTerm condition:", searchTerm);
      }

      // 2. Add conditions for selected 'keywords' (if provided)
      if (keywords) {
          const keywordArray = keywords.split(',')
                                      .map(k => k.trim())
                                      .filter(k => k && k.length > 0);

          if (keywordArray.length > 0) {
              console.log("Applying keyword conditions:", keywordArray);
              // For EACH keyword, create an $or condition (name match OR options match)
              // Then, use $and to ensure ALL selected keywords are matched somewhere
              const keywordConditions = keywordArray.map(keyword => {
                  const regexKeyword = new RegExp(keyword, 'i');
                  return { // This specific keyword must match name OR options
                      $or: [
                          { name: regexKeyword },
                          { options: regexKeyword }
                      ]
                  };
              });
              // Add these conditions wrapped in an $and to the main search array
               searchConditions.push({ $and: keywordConditions });
               // Alternative: If ANY keyword should match (instead of ALL), use $or:
               // searchConditions.push({ $or: keywordConditions });
          }
      }

      // 3. Combine searchConditions using $and if multiple exist
      if (searchConditions.length > 0) {
          // If there's only one condition (e.g., only searchTerm or only keywords),
          // use it directly. If multiple, wrap them in $and.
           filterCriteria.$and = (filterCriteria.$and || []).concat(searchConditions);
           console.log("Combined search conditions using $and.");
      }
      // Note: This structure assumes events must match BOTH searchTerm AND ALL selected keywords.
      // Adjust the logic (e.g., wrapping everything in a top-level $or) if different behavior is needed.


      // 4. Apply 'New Events' Filter
      if (isNew === 'true') {
          const twelveHoursAgoTimestampMs = Date.now() - (12 * 60 * 60 * 1000);
          const twelveHoursAgoDate = new Date(twelveHoursAgoTimestampMs);
          // Add the $gte condition using $and to ensure it combines with other filters
          filterCriteria.$and = (filterCriteria.$and || []); // Ensure $and array exists
          filterCriteria.$and.push({ createdAt: { $gte: twelveHoursAgoDate } });
          console.log("Applying 'New Events' filter (created since):", twelveHoursAgoDate);
      }

      // --- Final Query ---
      console.log("Executing MongoDB find with final criteria:", JSON.stringify(filterCriteria));

      const events = await EventModel.find(filterCriteria)
                                      .sort({ startTime: -1 });

      console.log(`Found ${events.length} events matching criteria.`);
      res.status(200).json(events);

  } catch (error) {
      console.error('!!! Error searching events:', error);
      res.status(500).json({ success: false, message: 'Server error searching events', error: error.message });
  }
};


// --- Add other event-related controller functions below if needed ---
// export const getAllEvents = async (req, res) => { ... };
// export const updateEvent = async (req, res) => { ... };
// export const deleteEvent = async (req, res) => { ... };