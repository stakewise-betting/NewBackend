// models/notification.js

import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    userIds: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }], // Store multiple user IDs
    message: { 
        type: String, 
        required: true 
    },
    image: { 
        type: String 
    },
    read: {
        type: Map,
        of: Boolean,
        default: new Map() // Maps userId -> read status
    }
}, { 
    timestamps: true 
});

// Method to mark notification as read for a user
NotificationSchema.methods.markAsReadForUser = function(userId) {
    if (!this.read) {
        this.read = new Map();
    }
    this.read.set(userId.toString(), true);
    return this.save();
};

// Check if notification is read by a user
NotificationSchema.methods.isReadByUser = function(userId) {
    return this.read && this.read.get(userId.toString()) === true;
};

export default mongoose.model("Notification", NotificationSchema);