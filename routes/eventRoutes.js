// routes/eventRoutes.js
import express from "express";
// Import BOTH controller functions now
import { createEvent, getEventById } from "../controllers/eventController.js";

const router = express.Router();

// Handles POST /api/events/
router.post('/', createEvent);

// --- ADD THIS LINE ---
// Handles GET /api/events/:id (e.g., /api/events/123)
router.get('/:id', getEventById);
// --------------------

export default router;