import mongoose from "mongoose";

const raffleSchema = new mongoose.Schema({
  raffleId: {
    type: Number,
    required: true,
    unique: true,
    index: true // Add index for faster lookups
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  imageURL: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: "General"
  },
  startTime: {
    type: Number, // Storing as Unix timestamp
    required: true
  },
  endTime: {
    type: Number, // Storing as Unix timestamp
    required: true
  },
  ticketPrice: {
    type: String, // Storing as string to handle large numbers (e.g., from Wei)
    required: true
  },
  prizeAmount: {
    type: String, // Storing as string
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  winnerWalletAddress: {
    type: String,
    default: null
  },
  totalTicketsSold: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

export default mongoose.model("Raffle", raffleSchema);