// controllers/adminController.js
import User from "../models/userModel.js"; // Make sure path is correct & using .js if needed for ESM

// Add this new function
export const getUserCount = async (req, res) => {
    try {
        // Count all documents in the User collection
        const totalUsers = await User.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalUsers: totalUsers, // Send the count back
            },
        });
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ success: false, message: "Server Error fetching user count" });
    }
};

// --- Keep your other existing controller functions below ---
// e.g., export const getDashboardStats = ... (if you created it before)