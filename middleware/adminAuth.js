// middleware/adminAuth.js <--- Make sure this is the file you paste into

import User from '../models/userModel.js'; // Adjust path if your models folder is different

export const isAdmin = async (req, res, next) => {
    // This middleware should run *after* the authentication middleware (authenticate/userAuth)
    // So, req.user should already be populated if the user is logged in.
    if (!req.user || !req.user.id) {
        // Should ideally not happen if authenticate ran first, but good safety check
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const userId = req.user.id;
        // Ensure you select the 'role' field. If it's not selected by default, add .select('+role')
        // Make sure the field name 'role' matches your User schema exactly.
        const user = await User.findById(userId).select('+role');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if the user has the 'admin' role (CASE SENSITIVE - adjust 'admin' if needed)
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
        }

        // If user is an admin, proceed to the next middleware or route handler
        next();

    } catch (error) {
        console.error("isAdmin Middleware Error:", error);
        res.status(500).json({ success: false, message: "Server error during authorization check" });
    }
};