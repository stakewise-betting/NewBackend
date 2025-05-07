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



















// import express from "express";
// // Import ALL controller functions
// import { createEvent, getEventById, searchEvents } from "../controllers/eventController.js"; // Add searchEvents

// const router = express.Router();

// // --- ADD THIS LINE for Search ---
// // Handles GET /api/events/search?searchTerm=...&keywords=...
// // IMPORTANT: Place this BEFORE the '/:id' route
// router.get('/search', searchEvents);
// // ------------------------------

// // Handles POST /api/events/
// router.post('/', createEvent);

// // Handles GET /api/events/:id (e.g., /api/events/123)
// router.get('/:id', getEventById);


// export default router;