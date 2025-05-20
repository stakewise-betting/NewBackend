import express from "express";
import {
  saveNews,
  getAllNews,
  getNewsByNewsId,
  updateNews,
  deleteNews,
  getNewsImage,
  upload
} from "../controllers/newsController.js";

const router = express.Router();

// Save a new news item with image upload
router.post("/save-news", upload.single('image'), saveNews);

// Get all news items
router.get("/all", getAllNews);

// Get news by ID
router.get("/:newsId", getNewsByNewsId);

// Get news image by ID
router.get("/:newsId/image", getNewsImage);

// Update existing news with image upload
router.put("/:newsId", upload.single('image'), updateNews);

// Delete news
router.delete("/:newsId", deleteNews);

export default router;