import cron from 'node-cron';
import leaderboardService from './leaderboardService.js';

class StatsScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Update stats every 30 minutes
  startScheduler() {
    // Update stats every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      if (this.isRunning) {
        console.log('Stats update already in progress, skipping...');
        return;
      }

      try {
        this.isRunning = true;
        console.log('Starting scheduled stats update...');
        await leaderboardService.updateAllUserStats();
        console.log('Scheduled stats update completed successfully');
      } catch (error) {
        console.error('Error in scheduled stats update:', error);
      } finally {
        this.isRunning = false;
      }
    });

    // Update ranks every hour
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('Starting scheduled rank update...');
        await leaderboardService.updateRanks();
        console.log('Scheduled rank update completed successfully');
      } catch (error) {
        console.error('Error in scheduled rank update:', error);
      }
    });

    console.log('Stats scheduler started successfully');
  }

  // Manual update method
  async updateNow() {
    try {
      if (this.isRunning) {
        throw new Error('Stats update already in progress');
      }

      this.isRunning = true;
      console.log('Starting manual stats update...');
      await leaderboardService.updateAllUserStats();
      console.log('Manual stats update completed successfully');
    } catch (error) {
      console.error('Error in manual stats update:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      message: this.isRunning ? 'Stats update in progress' : 'Stats scheduler idle'
    };
  }
}

export default new StatsScheduler();
