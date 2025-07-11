//services/raffleBlockchainService.js
import Web3 from "web3";
import config from "../config/config.js";
import raffleConfig from "../config/raffleConfig.js";

// Configure Web3 - Use the blockchain provider URL from the main config
const web3 = new Web3(config.blockchainProviderUrl);

// Get RaffleDraw contract ABI and address from raffleConfig
const raffleContractABI = raffleConfig.raffleContractABI;
const raffleContractAddress = raffleConfig.raffleContractAddress;

// Initialize contract
const raffleContract = new web3.eth.Contract(raffleContractABI, raffleContractAddress);

// Use the same approach for admin account as used in your other blockchain service
// This avoids the private key issue and uses a more generic approach for consistency
let adminAccount = null;

// For read-only functionality - no need to set up the admin account yet
// Admin account will be initialized when needed for admin operations

// Service for interacting with the RaffleDraw contract
export const raffleBlockchainService = {
  // Helper method to get admin account (initialize only when needed)
  getAdminAccount: async () => {
    try {
      if (!adminAccount) {
        const accounts = await web3.eth.getAccounts();
        adminAccount = accounts[0]; // Use the first account from the connected node
      }
      return adminAccount;
    } catch (error) {
      console.error("Error getting admin account:", error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Create a new raffle - Updated to use the RaffleParams struct
  createRaffleDraw: async (
    raffleId,
    name,
    description,
    imageURL,
    startTime,
    endTime,
    ticketPrice,
    prizeAmount,
    notificationImageURL,
    notificationMessage
  ) => {
    try {
      const adminAddress = await raffleBlockchainService.getAdminAccount();

      // Create RaffleParams struct for the updated contract
      const raffleParams = {
        name,
        description,
        imageURL,
        startTime,
        endTime,
        ticketPrice,
        prizeAmount,
        notificationImageURL,
        notificationMessage
      };

      const gasEstimate = await raffleContract.methods
        .createRaffleDraw(raffleId, raffleParams)
        .estimateGas({ from: adminAddress });

      const result = await raffleContract.methods
        .createRaffleDraw(raffleId, raffleParams)
        .send({
          from: adminAddress,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });

      return {
        success: true,
        transactionHash: result.transactionHash,
        raffleId
      };
    } catch (error) {
      console.error("Error creating raffle on blockchain:", error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Get all raffle IDs
  getAllRaffleIds: async () => {
    try {
      const raffleIds = await raffleContract.methods.getAllRaffleIds().call();
      return raffleIds.map(id => Number(id));
    } catch (error) {
      console.error("Error getting raffle IDs from blockchain:", error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Get raffle details by ID
  getRaffle: async (raffleId) => {
    try {
      const raffle = await raffleContract.methods.getRaffle(raffleId).call();
      
      // Convert BigNumber values to JavaScript numbers or strings
      return {
        raffleId: Number(raffle.raffleId),
        name: raffle.name,
        description: raffle.description,
        imageURL: raffle.imageURL,
        startTime: Number(raffle.startTime),
        endTime: Number(raffle.endTime),
        ticketPrice: web3.utils.fromWei(raffle.ticketPrice, 'ether'),
        prizeAmount: web3.utils.fromWei(raffle.prizeAmount, 'ether'),
        isCompleted: raffle.isCompleted,
        winner: raffle.winner,
        totalTicketsSold: Number(raffle.totalTicketsSold),
        notificationImageURL: raffle.notificationImageURL,
        notificationMessage: raffle.notificationMessage
      };
    } catch (error) {
      console.error(`Error getting raffle ${raffleId} from blockchain:`, error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Get active raffles
  getActiveRaffles: async () => {
    try {
      const activeRaffleIds = await raffleContract.methods.getActiveRaffles().call();
      
      // Fetch details for each active raffle
      const rafflePromises = activeRaffleIds.map(id => 
        raffleBlockchainService.getRaffle(Number(id))
      );
      
      return await Promise.all(rafflePromises);
    } catch (error) {
      console.error("Error getting active raffles from blockchain:", error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Buy tickets for a raffle
  buyTicket: async (raffleId, quantity, ticketPrice, userAddress) => {
    try {
      // Calculate total price in wei
      const totalPriceWei = web3.utils.toWei(
        (parseFloat(ticketPrice) * quantity).toString(),
        'ether'
      );
      
      const gasEstimate = await raffleContract.methods
        .buyTicket(raffleId, quantity)
        .estimateGas({
          from: userAddress,
          value: totalPriceWei
        });

      const result = await raffleContract.methods
        .buyTicket(raffleId, quantity)
        .send({
          from: userAddress,
          value: totalPriceWei,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });

      return {
        success: true,
        transactionHash: result.transactionHash,
        tickets: quantity
      };
    } catch (error) {
      console.error(`Error buying tickets for raffle ${raffleId}:`, error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Select winner for a raffle
  selectWinner: async (raffleId) => {
    try {
      const adminAddress = await raffleBlockchainService.getAdminAccount();
      
      // Check if raffle is ready for winner selection
      const isReady = await raffleContract.methods
        .raffleReadyForWinnerSelection(raffleId)
        .call();
      
      if (!isReady) {
        throw new Error("Raffle is not ready for winner selection");
      }
      
      const gasEstimate = await raffleContract.methods
        .selectWinner(raffleId)
        .estimateGas({
          from: adminAddress
        });

      const result = await raffleContract.methods
        .selectWinner(raffleId)
        .send({
          from: adminAddress,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });
      
      // Get winner from event logs
      const winnerEvent = result.events.WinnerSelected;
      if (!winnerEvent) {
        throw new Error("Winner selection event not found");
      }
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        winner: winnerEvent.returnValues.winner,
        prizeAmount: web3.utils.fromWei(winnerEvent.returnValues.prizeAmount, 'ether')
      };
    } catch (error) {
      console.error(`Error selecting winner for raffle ${raffleId}:`, error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Get user's tickets for a raffle
  getUserTickets: async (raffleId, userAddress) => {
    try {
      const ticketIds = await raffleContract.methods
        .getUserTickets(raffleId, userAddress)
        .call();
      
      return ticketIds.map(id => Number(id));
    } catch (error) {
      console.error(`Error getting user tickets for raffle ${raffleId}:`, error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Check if user has won a raffle
  hasUserWon: async (raffleId, userAddress) => {
    try {
      return await raffleContract.methods
        .hasUserWon(raffleId, userAddress)
        .call();
    } catch (error) {
      console.error(`Error checking if user won raffle ${raffleId}:`, error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  },

  // Get total admin profit
  getTotalAdminProfit: async () => {
    try {
      const profitWei = await raffleContract.methods.getTotalAdminProfit().call();
      return web3.utils.fromWei(profitWei, 'ether');
    } catch (error) {
      console.error("Error getting total admin profit:", error);
      throw new Error(`Blockchain error: ${error.message}`);
    }
  }
};

export default raffleBlockchainService;