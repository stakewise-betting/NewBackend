import express from "express";
import userAuth from "../middleware/userAuth.js";
import checkUserActive from "../middleware/checkUserActive.js";
import { 
  addToWatchlist, 
  removeFromWatchlist, 
  getWatchlist,
  isInWatchlist
} from "../controllers/watchlistController.js";

const router = express.Router();

// All routes require authentication and active account
// Apply the userAuth middleware to all watchlist routes first.
router.use(userAuth);
// Then, apply checkUserActive to ensure the authenticated user is active.
router.use(checkUserActive);

// Watchlist routes
router.post("/add", addToWatchlist);
router.delete("/remove/:eventId", removeFromWatchlist);
router.get("/", getWatchlist);
router.get("/check/:eventId", isInWatchlist);

export default router;