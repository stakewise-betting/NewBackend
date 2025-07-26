// models/watchlist.js
import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true
    },
    eventId: {
      type: Number,
      required: true,
      index: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound index to ensure a user can only add an event once to their watchlist
watchlistSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const watchlist = mongoose.models.watchlist || mongoose.model("watchlist", watchlistSchema);
export default watchlist;