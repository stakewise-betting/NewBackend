// DB>>const mongoose = require("mongoose");
const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema({
  betId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 }
});

module.exports = mongoose.model("Comment", commentSchema);