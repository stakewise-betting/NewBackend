import watchlist from "../models/watchlist.js";
import eventModel from "../models/event.js";

// Add an event to user's watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const { eventId } = req.body;  // Get the Mongoose ObjectId from the authenticated user
    const userId = req.user._id; // Expecting { "eventId": 123 }

    if (!eventId) {
      return res.status(400).json({ 
        success: false, 
        message: "Event ID is required" 
      });
    }

    // Check if event exists
    const eventExists = await eventModel.findOne({ eventId });
    if (!eventExists) {
      return res.status(404).json({ 
        success: false, 
        message: "Event not found" 
      });
    }

    // Check if already in watchlist
    const existingItem = await watchlist.findOne({ userId, eventId });
    if (existingItem) {
      return res.status(409).json({ 
        success: false, 
        message: "Event already in watchlist" 
      });
    }

    // Add to watchlist
    const watchlistItem = new watchlist({
      userId,
      eventId
    });

    await watchlistItem.save();

    return res.status(201).json({
      success: true,
      message: "Event added to watchlist",
      watchlistItem
    });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add event to watchlist",
      error: error.message
    });
  }
};

// Remove an event from user's watchlist
export const removeFromWatchlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    if (!eventId) {
      return res.status(400).json({ 
        success: false, 
        message: "Event ID is required" 
      });
    }

    const result = await watchlist.findOneAndDelete({ 
      userId, 
      eventId: Number(eventId) 
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Event not found in watchlist"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event removed from watchlist"
    });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove event from watchlist",
      error: error.message
    });
  }
};

// Get user's watchlist
export const getWatchlist = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all watchlist items for this user
    const watchlistItems = await watchlist.find({ userId });
    
    if (watchlistItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Watchlist is empty",
        watchlistEvents: []
      });
    }
    
    // Extract event IDs from watchlist
    const eventIds = watchlistItems.map(item => item.eventId);
    
    // Get full event details for each ID in the watchlist
    const events = await eventModel.find({ eventId: { $in: eventIds } });
    
    // Map events to include watchlist info
    const watchlistEvents = events.map(event => ({
      _id: event._id,
      eventId: event.eventId,
      name: event.name,
      description: event.description,
      imageURL: event.imageURL,
      startTime: event.startTime,
      endTime: event.endTime,
      options: event.options,
      category: event.category,
      createdAt: event.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: watchlistEvents.length,
      watchlistEvents
    });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch watchlist",
      error: error.message
    });
  }
};

// Check if an event is in user's watchlist
export const isInWatchlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const exists = await watchlist.findOne({ 
      userId, 
      eventId: Number(eventId) 
    });

    return res.status(200).json({
      success: true,
      isInWatchlist: !!exists
    });
  } catch (error) {
    console.error("Error checking watchlist status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check watchlist status",
      error: error.message
    });
  }
};