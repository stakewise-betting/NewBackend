//NewBackend/routes/interests.js
import express from 'express';
import Interest from '../models/interest.js';
import User from '../models/userModel.js'; // Ensure the path is correct
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route   POST /api/interests/:eventId/toggle
 * @desc    Toggle a user's interest status for a specific event.
 * @access  Private (requires user to be logged in)
 */
router.post("/:eventId/toggle", async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    // --- Validation ---
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "A valid user ID is required." });
    }

    try {
        // --- Verify User Exists ---
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // --- Find or Create the Interest Document for the Event ---
        let eventInterest = await Interest.findOne({ eventId });

        if (!eventInterest) {
            // If the document doesn't exist, create it.
            eventInterest = new Interest({ eventId, interestedBy: [], interestedCount: 0 });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const userIndex = eventInterest.interestedBy.findIndex(id => id.equals(userObjectId));

        // --- Toggle Logic ---
        if (userIndex > -1) {
            // If user is already in the array, remove them.
            eventInterest.interestedBy.splice(userIndex, 1);
        } else {
            // If user is not in the array, add them.
            eventInterest.interestedBy.push(userObjectId);
        }
        
        // Update the count based on the array's new length.
        eventInterest.interestedCount = eventInterest.interestedBy.length;
        
        await eventInterest.save();

        // --- Respond with the updated state ---
        res.status(200).json({
            message: "Interest status updated successfully.",
            interestedCount: eventInterest.interestedCount,
            isUserInterested: userIndex === -1, // `true` if the user was just added.
        });

    } catch (error) {
        console.error("Error toggling interest:", error);
        res.status(500).json({ message: "An internal server error occurred while updating interest." });
    }
});

/**
 * @route   POST /api/interests/status
 * @desc    Get interest status for multiple events for a given user.
 * @access  Public
 */
router.post("/status", async (req, res) => {
    const { eventIds, userId } = req.body;

    // --- Validation ---
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return res.status(400).json({ message: "An array of event IDs is required." });
    }

    try {
        // Find all interest documents that match the provided event IDs.
        const interests = await Interest.find({ eventId: { $in: eventIds } });

        // Create a map for quick lookups on the frontend.
        const interestMap = interests.reduce((acc, interest) => {
            let isUserInterested = false;
            // Check interest status only if a valid userId was provided.
            if (userId && mongoose.Types.ObjectId.isValid(userId)) {
                const userObjectId = new mongoose.Types.ObjectId(userId);
                isUserInterested = interest.interestedBy.some(id => id.equals(userObjectId));
            }
            
            acc[interest.eventId] = {
                interestedCount: interest.interestedCount,
                isUserInterested: isUserInterested,
            };
            return acc;
        }, {});

        // Ensure every requested eventId has an entry in the response, even if it has 0 interest.
        eventIds.forEach(id => {
            if (!interestMap[id]) {
                interestMap[id] = { interestedCount: 0, isUserInterested: false };
            }
        });

        res.status(200).json(interestMap);

    } catch (error) {
        console.error("Error fetching interest status:", error);
        res.status(500).json({ message: "An internal server error occurred while fetching interest data." });
    }
});

export default router;