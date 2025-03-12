// controllers/eventController.js

import EventModel from "../models/event.js";

export const createEvent = async (req, res) => {

    try {
        const eventData = req.body;

        console.log("Received eventData in /api/events:", eventData);
        console.log("eventData.eventId:", eventData.eventId);

        const newEvent = new EventModel({
            eventId: eventData.eventId,
            name: eventData.name,
            description: eventData.description,
            imageURL: eventData.imageURL,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            options: eventData.options,
            notificationMessage: eventData.notificationMessage,
            notificationImageURL: eventData.notificationImageURL
        });

        await newEvent.save();
        console.log('Event saved to MongoDB:', newEvent);
        res.status(201).send({ message: 'Event saved to MongoDB', eventId: eventData.eventId });
    } catch (error) {
        console.error('Error saving event to MongoDB:', error);

        res.status(500).send({ message: 'Failed to save event to MongoDB', error });
    }
};

