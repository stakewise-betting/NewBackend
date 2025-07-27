import express from "express";
import {
  saveNews,
  getAllNews,
  getNewsByNewsId,
  updateNews,
  deleteNews,
  getNewsImage,
  upload,
} from "../controllers/newsController.js";

import {
  getTwitterNews,
  getCryptoNews,
  clearNewsCache,
  getCacheStatus
} from "../controllers/externalNewsController.js";

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

// Get Twitter news
router.get("/external/twitter", getTwitterNews);

// Get crypto news
router.get("/external/crypto", getCryptoNews);

// Clear cache for specific source or all
router.delete("/cache/:source", clearNewsCache);

// Get cache status and statistics
router.get("/cache/status", getCacheStatus);

// Health check for external APIs
router.get("/external/health", async (req, res) => {
  try {
    const health = {
      twitter: {
        configured: !!process.env.TWITTER_BEARER_TOKEN,
        status: 'unknown'
      },
      crypto: {
        configured: !!process.env.CRYPTO_API_KEY,
        status: 'unknown'
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

export default router;