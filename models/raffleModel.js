import mongoose from "mongoose";

const raffleSchema = new mongoose.Schema({
  raffleId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  imageURL: {
    type: String,
    required: true
  },
  startTime: {
    type: Number,
    required: true
  },
  endTime: {
    type: Number,
    required: true
  },
  ticketPrice: {
    type: Number,
    required: true
  },
  prizeAmount: {
    type: Number,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  winner: {
    type: String,
    default: null
  },
  totalTicketsSold: {
    type: Number,
    default: 0
  },
  notificationImageURL: {
    type: String,
    default: ""
  },
  notificationMessage: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    default: "General"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
raffleSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Raffle", raffleSchema);