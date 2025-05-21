// routes/eventRoutes.js
import express from "express";
// Import searchEvents controller function
import { createEvent, getEventById, searchEvents } from "../controllers/eventController.js";

const router = express.Router();

// Handles POST /api/events/
router.post('/', createEvent);

// --- NEW: Route for searching events ---
// IMPORTANT: Place this before the '/:id' route
router.get('/search', searchEvents);

// Handles GET /api/events/:id (e.g., /api/events/123)
router.get('/:id', getEventById);

export default router;