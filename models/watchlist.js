// // models/watchlist.js
// import mongoose from 'mongoose';

// const watchlistSchema = new mongoose.Schema({
//   userId: { // Reference to the User document's _id
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true, // Index for faster lookups by user
//   },
//   numericEventId: { // Store the numeric eventId from the Event data
//     type: Number,
//     required: true,
//     index: true, // Index for faster lookups by event id
//   },
//   // Optional: You *could* also store a direct reference to the Event document's _id
//   // if your EventModel uses default ObjectIds and you need population,
//   // but based on your setup, linking via numericEventId seems intended.
//   // eventRef: {
//   //   type: mongoose.Schema.Types.ObjectId,
//   //   ref: 'Event' // Assumes Event model is named 'Event'
//   // }
// }, { timestamps: true }); // Adds createdAt and updatedAt automatically

// // Create a compound unique index to prevent a user from adding the
// // same numeric event ID to their watchlist multiple times.
// watchlistSchema.index({ userId: 1, numericEventId: 1 }, { unique: true });

// const Watchlist = mongoose.model('Watchlist', watchlistSchema);
// export default Watchlist;




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