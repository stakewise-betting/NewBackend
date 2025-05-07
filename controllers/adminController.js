// Backend/NewBackend/controllers/adminController.js
import userModel from "../models/userModel.js"; // Make sure userModel is imported
import mongoose from "mongoose";

// --- Existing getUserCount function (keep it) ---
export const getUserCount = async (req, res) => {
    try {
        // Only count users with email or walletAddress (actual registered users)
        const userCount = await userModel.countDocuments({
            $or: [
                { email: { $ne: null, $ne: "" } },
                { walletAddress: { $ne: null, $ne: "" } },
            ],
            // Optionally exclude admins if needed later: role: { $ne: 'admin' }
        });
        res.status(200).json({ count: userCount });
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ message: "Error fetching user count", error: error.message });
    }
};


// --- NEW: Function to get all users ---
export const getAllUsers = async (req, res) => {
    try {
        // Fetch all users, excluding password field for security
        const users = await userModel.find({}).select('-password -verifyOtp -resetOtp'); // Exclude sensitive fields
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

// --- NEW: Function to delete a user ---
export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    // Validate if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID format." });
    }

    try {
        const deletedUser = await userModel.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Optional: Add logic here to clean up related data if necessary
        // (e.g., bets, comments associated with the user) - For now, just delete the user

        res.status(200).json({ message: "User deleted successfully.", userId: deletedUser._id });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

// --- Keep other existing controller functions below ---