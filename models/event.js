// models/event.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    eventId: {
        type: Number,
        required: true,
        unique: true,
        index: true // Keep this index
    },
    name: {
        type: String,
        required: true,
        index: true // Add index for searching
        // Alternatively, consider a text index later if needed: text: true
    },
    description: { type: String, required: true },
    rules: { type: String, required: true },
    imageURL: { type: String, required: true },
    startTime: { type: Number, required: true, index: true }, // Index startTime for sorting/filtering
    endTime: { type: Number, required: true },
    options: {
        type: [String],
        required: true,
        index: true // Add index for searching within options
        // Alternatively, consider a text index later if needed: text: true
    },
    notificationMessage: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    notificationImageURL: { type: String, required: true },
    category: { type: String, required: true },

    // Add other fields if they exist in your actual model (like listedBy, volume etc. from controller)
    listedBy: { type: String, default: 'Admin' },
    volume: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    winningOption: { type: String, default: null },
});

// Optional: If you want more powerful text search across name and options later:
// eventSchema.index({ name: 'text', options: 'text' });

export default mongoose.model("Event", eventSchema);