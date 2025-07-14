import leaderboardService from '../services/leaderboardService.js';
import UserStatsModel from '../models/userStatsModel.js';

// Get leaderboard data
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 50, offset = 0, metric = 'netProfit' } = req.query;
    
    const leaderboard = await leaderboardService.getLeaderboard(
      parseInt(limit), 
      parseInt(offset)
    );

    const totalUsers = await UserStatsModel.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: leaderboard,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalUsers,
        hasMore: parseInt(offset) + parseInt(limit) < totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard data',
      error: error.message
    });
  }
};

// Get user's rank and stats
export const getUserRank = async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        message: 'User address is required'
      });
    }

    const userStats = await UserStatsModel.findOne({ 
      userAddress: userAddress.toLowerCase(), 
      isActive: true 
    }).populate('userId', 'fname lname username walletAddress picture');

    if (!userStats) {
      return res.status(404).json({
        success: false,
        message: 'User stats not found'
      });
    }

    res.json({
      success: true,
      data: {
        rank: userStats.rank,
        userAddress: userStats.userAddress,
        userData: userStats.userId,
        totalEarned: userStats.totalEarned,
        totalLoss: userStats.totalLoss,
        netProfit: userStats.netProfit,
        totalBetsPlaced: userStats.totalBetsPlaced,
        totalAmountWagered: userStats.totalAmountWagered,
        winRate: userStats.winRate,
        totalWins: userStats.totalWins,
        totalLosses: userStats.totalLosses,
        lastUpdated: userStats.lastUpdated,
      }
    });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank',
      error: error.message
    });
  }
};

// Get top performers by specific metric
export const getTopPerformers = async (req, res) => {
  try {
    const { metric = 'netProfit', limit = 10 } = req.query;
    
    const validMetrics = ['netProfit', 'totalEarned', 'winRate', 'totalBetsPlaced'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric. Valid metrics: ' + validMetrics.join(', ')
      });
    }

    const topPerformers = await leaderboardService.getTopPerformers(metric, parseInt(limit));

    res.json({
      success: true,
      data: topPerformers,
      metric
    });
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top performers',
      error: error.message
    });
  }
};

// Manually update user stats (admin only)
export const updateUserStats = async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        message: 'User address is required'
      });
    }

    const updatedStats = await leaderboardService.updateUserStats(userAddress);

    res.json({
      success: true,
      message: 'User stats updated successfully',
      data: updatedStats
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user stats',
      error: error.message
    });
  }
};

// Manually update all user stats (admin only)
export const updateAllUserStats = async (req, res) => {
  try {
    await leaderboardService.updateAllUserStats();

    res.json({
      success: true,
      message: 'All user stats updated successfully'
    });
  } catch (error) {
    console.error('Error updating all user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update all user stats',
      error: error.message
    });
  }
};

// Get leaderboard statistics
export const getLeaderboardStats = async (req, res) => {
  try {
    const totalUsers = await UserStatsModel.countDocuments({ isActive: true });
    const totalBets = await UserStatsModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalBetsPlaced' } } }
    ]);
    
    const totalVolume = await UserStatsModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalAmountWagered' } } }
    ]);

    const topProfitUser = await UserStatsModel.findOne({ isActive: true })
      .sort({ netProfit: -1 })
      .populate('userId', 'fname lname username walletAddress picture');

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBets: totalBets[0]?.total || 0,
        totalVolume: totalVolume[0]?.total || 0,
        topProfitUser: topProfitUser ? {
          rank: topProfitUser.rank,
          userAddress: topProfitUser.userAddress,
          userData: topProfitUser.userId,
          netProfit: topProfitUser.netProfit,
          winRate: topProfitUser.winRate
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard statistics',
      error: error.message
    });
  }
};
