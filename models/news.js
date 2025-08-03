import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  newsId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: String, default: "Admin" },
  publishDate: { type: Date, default: Date.now },
  image: {
    public_id: {
      type: String,
      required: false
    },
    url: {
      type: String,
      required: false
    }
  }
});

export default mongoose.model("News", newsSchema);