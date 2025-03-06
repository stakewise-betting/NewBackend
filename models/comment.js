// DB>>const mongoose = require("mongoose");
import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({
  betId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }, // Add userId field, referencing the 'user' model
  username: { type: String, required: true }, // We'll still store username for display, but fetch it from user data
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 }
});


export default mongoose.model("Comment", commentSchema);