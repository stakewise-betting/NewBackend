import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  eventId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  winner: { type: String, required: true },
  prizepool: { type: Number, required: true },
  releasedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Result", resultSchema);