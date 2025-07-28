//NewBackend/models/interest.js
import mongoose from "mongoose";

const interestSchema = new mongoose.Schema({
  // The event ID from the smart contract, indexed for fast lookups.
  eventId: { 
    type: String, 
    required: true, 
    unique: true, // Ensures one document per event.
    index: true 
  },
  // Stores an array of user IDs who have shown interest.
  interestedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user" 
  }],
  // A denormalized count of the number of users.
  // This avoids having to calculate the array length on every read.
  interestedCount: { 
    type: Number, 
    default: 0 
  },
}, {
  // Automatically add createdAt and updatedAt timestamps.
  timestamps: true 
});

export default mongoose.model("Interest", interestSchema);