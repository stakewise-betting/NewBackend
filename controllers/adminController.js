// Backend/NewBackend/controllers/adminController.js
import userModel from "../models/userModel.js";

export const getUserCount = async (req, res) => {
    try {
        const userCount = await userModel.countDocuments();
        res.status(200).json({ count: userCount });
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, "-password").sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Prevent admin from deleting themselves
        if (req.user._id.toString() === userId) {
            return res.status(400).json({ 
                success: false, 
                message: "You cannot delete your own account" 
            });
        }

        const deletedUser = await userModel.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "User deleted successfully", 
            userId 
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};


export const changeUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newRole } = req.body;

        // Validate the new role
        const validRoles = ['user', 'admin', 'moderator'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Valid roles are: user, admin, moderator"
            });
        }

        // Prevent admin from changing their own role (security measure)
        if (req.user._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role"
            });
        }

        // Find and update the user
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true, select: "-password" }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `User role successfully changed to ${newRole}`,
            user: updatedUser
        });

    } catch (error) {
        console.error("Error changing user role:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};