// Backend/NewBackend/routes/adminRoutes.js
import express from "express";
// Import your controller functions AND middleware
import {
    getUserCount,
    getAllUsers, // <-- Import new function
    deleteUser   // <-- Import new function
} from "../controllers/adminController.js";
import authenticate from "../middleware/userAuth.js"; // Default import

// --- You might need an isAdmin middleware later, but for now, authenticate is used ---
// import isAdmin from '../middleware/adminAuth.js'; // Assuming you create this later

const router = express.Router();

// --- Existing Routes ---
router.get("/user-count", authenticate, getUserCount);
// Add other existing admin routes here...

// --- NEW User Management Routes ---
router.get("/users", authenticate, getAllUsers); // Route to get all users
router.delete("/users/:userId", authenticate, deleteUser); // Route to delete a user by ID

// --- Keep your other existing admin routes below if any ---
// e.g., router.get("/dashboard-stats", authenticate, /* isAdmin, */ getDashboardStats);

export default router;