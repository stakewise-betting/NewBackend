import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    eventId: { 
        type: Number, 
        required: true, 
        unique: true, 
        index: true // **Explicitly add index: true** 
    }, 
    name: { type: String, required: true },
    description: { type: String, required: true },
    rules: { type: String, required: true },
    imageURL: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    options: { type: [String], required: true },
    notificationMessage: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    notificationImageURL: { type: String, required: true },
    category: { type: String, required: true }, // Default category

});

export default mongoose.model("Event", eventSchema);