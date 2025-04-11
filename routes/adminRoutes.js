// routes/adminRoutes.js
import express from "express";
// Import your controller function AND middleware
import { getUserCount } from "../controllers/adminController.js"; // Adjust path
// routes/adminRoutes.js - CORRECTED IMPORT FOR DEFAULT
import authenticate from "../middleware/userAuth.js"; // Use 'authenticate' to represent the default export

// --- Problem: isAdmin is still missing ---
// You also need an isAdmin middleware. We'll address this next.
// For now, let's assume you'll create it.
import { isAdmin } from "../middleware/adminAuth.js"; // EXAMPLE: Assuming isAdmin is in a separate file

const router = express.Router();

// Define the new route: GET /api/admin/user-count
router.get("/user-count", authenticate, getUserCount); 

// --- Keep your other existing admin routes below ---
// e.g., router.get("/dashboard-stats", ...);

export default router;