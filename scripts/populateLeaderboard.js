// scripts/populateLeaderboard.js
import mongoose from 'mongoose';
import config from '../config/config.js';
import LeaderboardService from '../services/leaderboardService.js';

const populateLeaderboard = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.databaseUrl);
    console.log('Connected to MongoDB');

    console.log('Starting leaderboard population...');
    
    // Update all user stats from blockchain
    await LeaderboardService.updateAllUserStats();
    
    console.log('Leaderboard population completed successfully!');
    
    // Get and display the leaderboard
    const leaderboard = await LeaderboardService.getLeaderboard(10, 0);
    console.log('\nTop 10 users:');
    leaderboard.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userAddress} - Net Profit: ${user.netProfit} ETH`);
    });
    
  } catch (error) {
    console.error('Error populating leaderboard:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

populateLeaderboard();
