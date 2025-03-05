const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    betId: { type: String, required: true }, // The betting event ID
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  });

module.exports = mongoose.model("Comment", commentSchema);