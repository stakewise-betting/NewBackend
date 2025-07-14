import Web3 from 'web3';
import UserStatsModel from '../models/userStatsModel.js';
import UserModel from '../models/userModel.js';
import config from '../config/config.js';

class LeaderboardService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.initializeWeb3();
  }

  async initializeWeb3() {
    try {
      if (!config.blockchainProviderUrl) {
        throw new Error("BLOCKCHAIN_PROVIDER_URL is not defined");
      }

      this.web3 = new Web3(new Web3.providers.HttpProvider(config.blockchainProviderUrl));
      this.contract = new this.web3.eth.Contract(config.contractABI, config.contractAddress);
    } catch (error) {
      console.error("Error initializing Web3:", error);
    }
  }

  async calculateWinnings(eventId, betAmount, userAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      // Get event details
      const eventDetails = await this.contract.methods.getEvent(eventId).call();
      
      // Get user's bet details
      const userBet = await this.contract.methods.getUserBet(eventId, userAddress).call();
      const userOption = userBet[0];
      
      // Check if user won
      if (eventDetails.winningOption !== userOption) {
        return 0; // User lost
      }

      // Get all BetPlaced events for this event
      const allBetEvents = await this.contract.getPastEvents("BetPlaced", {
        filter: { eventId },
        fromBlock: 0,
        toBlock: "latest",
      });

      // Calculate total winners bet amount
      let totalWinnersBetAmount = 0;
      for (const betEvent of allBetEvents) {
        if (betEvent.returnValues.option === eventDetails.winningOption) {
          totalWinnersBetAmount += parseFloat(this.web3.utils.fromWei(betEvent.returnValues.amount, "ether"));
        }
      }

      if (totalWinnersBetAmount === 0) return 0;

      // Calculate winnings based on smart contract logic
      const prizePool = parseFloat(this.web3.utils.fromWei(eventDetails.prizePool, "ether"));
      const adminFee = prizePool * 0.05; // 5% admin fee
      const remainingPrizePool = prizePool - adminFee;
      const winnerReward = (betAmount * remainingPrizePool) / totalWinnersBetAmount;
      
      return winnerReward;
    } catch (error) {
      console.error("Error calculating winnings:", error);
      return 0;
    }
  }

  async calculateUserStats(userAddress) {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      // Get all event IDs
      const eventIds = await this.contract.methods.getAllEventIds().call();
      
      // Initialize stats
      let totalEarned = 0;
      let totalLoss = 0;
      let totalBetsPlaced = 0;
      let totalAmountWagered = 0;
      let totalWins = 0;
      let totalLosses = 0;
      
      // Get user's bets for each event
      for (const eventId of eventIds) {
        const userBet = await this.contract.methods.getUserBet(eventId, userAddress).call();
        const exists = userBet[2];
        
        if (exists) {
          const betAmountWei = userBet[1];
          const betAmount = parseFloat(this.web3.utils.fromWei(betAmountWei, "ether"));
          
          // Get event details
          const eventDetails = await this.contract.methods.getEvent(eventId).call();
          
          const userOption = userBet[0];
          const isCompleted = eventDetails.isCompleted;
          
          totalBetsPlaced++;
          totalAmountWagered += betAmount;
          
          if (isCompleted) {
            const isWon = eventDetails.winningOption === userOption;
            const isLost = eventDetails.winningOption !== userOption;
            
            if (isWon) {
              totalWins++;
              const winnings = await this.calculateWinnings(eventId, betAmount, userAddress);
              totalEarned += winnings;
            } else if (isLost) {
              totalLosses++;
              totalLoss += betAmount;
            }
          }
        }
      }

      // Calculate derived stats
      const netProfit = totalEarned - totalLoss;
      const completedBets = totalWins + totalLosses;
      const winRate = completedBets > 0 ? (totalWins / completedBets) * 100 : 0;

      return {
        totalEarned,
        totalLoss,
        netProfit,
        totalBetsPlaced,
        totalAmountWagered,
        winRate,
        totalWins,
        totalLosses,
      };
    } catch (error) {
      console.error("Error calculating user stats:", error);
      return {
        totalEarned: 0,
        totalLoss: 0,
        netProfit: 0,
        totalBetsPlaced: 0,
        totalAmountWagered: 0,
        winRate: 0,
        totalWins: 0,
        totalLosses: 0,
      };
    }
  }

  async updateUserStats(userAddress) {
    try {
      const stats = await this.calculateUserStats(userAddress);
      
      // Try to find associated user by wallet address
      const user = await UserModel.findOne({ walletAddress: userAddress });
      
      const updateData = {
        ...stats,
        userId: user ? user._id : null,
        lastUpdated: new Date(),
      };

      const updatedStats = await UserStatsModel.findOneAndUpdate(
        { userAddress },
        updateData,
        { upsert: true, new: true }
      );

      return updatedStats;
    } catch (error) {
      console.error("Error updating user stats:", error);
      throw error;
    }
  }

  async updateAllUserStats() {
    try {
      if (!this.contract) {
        throw new Error("Contract not initialized");
      }

      console.log("Starting to update all user stats...");

      // Get all unique users who have placed bets
      const betEvents = await this.contract.getPastEvents("BetPlaced", {
        fromBlock: 0,
        toBlock: "latest"
      });

      const uniqueUsers = [...new Set(betEvents.map(event => event.returnValues.bettor))];
      console.log(`Found ${uniqueUsers.length} unique users`);

      const updatePromises = uniqueUsers.map(userAddress => 
        this.updateUserStats(userAddress)
      );

      await Promise.all(updatePromises);

      // Update ranks
      await this.updateRanks();

      console.log("All user stats updated successfully");
    } catch (error) {
      console.error("Error updating all user stats:", error);
      throw error;
    }
  }

  async updateRanks() {
    try {
      // Get all users sorted by net profit (descending)
      const users = await UserStatsModel.find({ isActive: true })
        .sort({ netProfit: -1 })
        .select('_id userAddress netProfit');

      // Update ranks in batches
      const batchSize = 100;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const updatePromises = batch.map((user, index) => 
          UserStatsModel.findByIdAndUpdate(user._id, { rank: i + index + 1 })
        );
        await Promise.all(updatePromises);
      }

      console.log(`Updated ranks for ${users.length} users`);
    } catch (error) {
      console.error("Error updating ranks:", error);
      throw error;
    }
  }

  async getLeaderboard(limit = 50, offset = 0) {
    try {
      const leaderboard = await UserStatsModel.find({ isActive: true })
        .populate('userId', 'fname lname username walletAddress picture')
        .sort({ netProfit: -1 })
        .skip(offset)
        .limit(limit)
        .lean();

      return leaderboard.map(user => ({
        rank: user.rank,
        userAddress: user.userAddress,
        userData: user.userId,
        totalEarned: user.totalEarned,
        totalLoss: user.totalLoss,
        netProfit: user.netProfit,
        totalBetsPlaced: user.totalBetsPlaced,
        totalAmountWagered: user.totalAmountWagered,
        winRate: user.winRate,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        lastUpdated: user.lastUpdated,
      }));
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }

  async getUserRank(userAddress) {
    try {
      const userStats = await UserStatsModel.findOne({ userAddress, isActive: true });
      return userStats ? userStats.rank : null;
    } catch (error) {
      console.error("Error getting user rank:", error);
      throw error;
    }
  }

  async getTopPerformers(metric = 'netProfit', limit = 10) {
    try {
      const sortField = {};
      sortField[metric] = -1;

      const topPerformers = await UserStatsModel.find({ isActive: true })
        .populate('userId', 'fname lname username walletAddress picture')
        .sort(sortField)
        .limit(limit)
        .lean();

      return topPerformers;
    } catch (error) {
      console.error("Error getting top performers:", error);
      throw error;
    }
  }
}

export default new LeaderboardService();
