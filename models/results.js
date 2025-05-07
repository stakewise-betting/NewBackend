import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    eventId: { 
        type: Number, 
        required: true, 
        unique: true, 
        index: true // **Explicitly add index: true** 
    }, 
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageURL: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    releasededAt: { type: Date, default: Date.now },
    category: { type: String, required: true }, // Default category
    winner: { type: String, required: true },
    prizepool: { type: Number, required: true },
});

export default mongoose.model("Result", resultSchema);