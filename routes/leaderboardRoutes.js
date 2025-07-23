import express from 'express';
import {
  getLeaderboard,
  getUserRank,
  getTopPerformers,
  updateUserStats,
  updateAllUserStats,
  getLeaderboardStats
} from '../controllers/leaderboardController.js';
import userAuth from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/user/:userAddress/rank', getUserRank);
router.get('/top-performers', getTopPerformers);
router.get('/leaderboard/stats', getLeaderboardStats);

// Protected routes (require authentication)
router.put('/user/:userAddress/update-stats', userAuth, updateUserStats);

// Admin routes
router.put('/leaderboard/update-all', adminAuth, updateAllUserStats);

export default router;
