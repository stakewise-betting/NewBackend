// DB >> models/comment.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  betId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }], // Stores users who liked this comment
  // --- New field for threading ---
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Null for top-level comments
  // --- Optional: Add a flag for deleted comments to preserve thread structure ---
  isDeleted: { type: Boolean, default: false }
});

// Ensure index for efficient querying by betId and parentId
commentSchema.index({ betId: 1, parentId: 1, createdAt: 1 });

export default mongoose.model("Comment", commentSchema);