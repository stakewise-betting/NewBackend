// DB>>const mongoose = require("mongoose");
import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({
  betId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 }
});


export default mongoose.model("Comment", commentSchema);