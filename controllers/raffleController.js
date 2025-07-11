import Raffle from "../models/raffleModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { raffleBlockchainService } from "../services/raffleBlockchainService.js";
import Web3 from "web3";
import config from "../config/config.js"; // Corrected import path

const web3 = new Web3(config.blockchainProviderUrl);

// Create a new raffle
export const createRaffle = async (req, res) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      ticketPrice,
      prizeAmount,
      notificationMessage,
      category
    } = req.body;

    // Validate required fields
    if (!name || !description || !startTime || !endTime || !ticketPrice || !prizeAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required fields" 
      });
    }

    // Validate time inputs
    const now = Math.floor(Date.now() / 1000);
    const parsedStartTime = parseInt(startTime);
    const parsedEndTime = parseInt(endTime);

    if (parsedStartTime < now) {
      return res.status(400).json({
        success: false,
        message: "Start time cannot be in the past"
      });
    }

    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time"
      });
    }

    // Get next raffle ID from the database
    const maxRaffleDocument = await Raffle.findOne({}).sort({ raffleId: -1 });
    const nextRaffleId = maxRaffleDocument ? maxRaffleDocument.raffleId + 1 : 1;

    // Process images if uploaded
    let imageURL = "";
    let notificationImageURL = "";

    if (req.files && req.files.image) {
      const result = await cloudinary.uploader.upload(req.files.image[0].path, {
        folder: "stakewise/raffles",
      });
      imageURL = result.secure_url;
    }

    if (req.files && req.files.notificationImage) {
      const result = await cloudinary.uploader.upload(req.files.notificationImage[0].path, {
        folder: "stakewise/raffles/notifications",
      });
      notificationImageURL = result.secure_url;
    }

    // Save raffle to blockchain
    try {
      await raffleBlockchainService.createRaffleDraw(
        nextRaffleId,
        name,
        description,
        imageURL,
        parsedStartTime,
        parsedEndTime,
        web3.utils.toWei(ticketPrice.toString(), "ether"),
        web3.utils.toWei(prizeAmount.toString(), "ether"),
        notificationImageURL,
        notificationMessage || ""
      );
    } catch (blockchainError) {
      console.error("Blockchain error:", blockchainError);
      return res.status(500).json({
        success: false,
        message: "Failed to save raffle to blockchain",
        error: blockchainError.message
      });
    }

    // Create and save raffle to database
    const newRaffle = new Raffle({
      raffleId: nextRaffleId,
      name,
      description,
      imageURL,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      ticketPrice: parseFloat(ticketPrice),
      prizeAmount: parseFloat(prizeAmount),
      notificationImageURL,
      notificationMessage: notificationMessage || "",
      category: category || "General"
    });

    await newRaffle.save();

    return res.status(201).json({
      success: true,
      message: "Raffle created successfully",
      raffle: newRaffle
    });
  } catch (error) {
    console.error("Error creating raffle:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create raffle",
      error: error.message
    });
  }
};

// Get all raffles
export const getAllRaffles = async (req, res) => {
  try {
    const raffles = await Raffle.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: raffles.length,
      data: raffles
    });
  } catch (error) {
    console.error("Error fetching raffles:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch raffles",
      error: error.message
    });
  }
};

// Get raffle by ID
export const getRaffleById = async (req, res) => {
  try {
    const { raffleId } = req.params;
    
    // Try to find raffle in the database
    const raffle = await Raffle.findOne({ raffleId: parseInt(raffleId) });
    
    if (!raffle) {
      return res.status(404).json({
        success: false,
        message: "Raffle not found"
      });
    }

    // If found, get additional blockchain data
    try {
      const blockchainRaffle = await raffleBlockchainService.getRaffle(raffleId);
      
      // Merge blockchain data with database data
      const mergedData = {
        ...raffle.toObject(),
        totalTicketsSold: blockchainRaffle.totalTicketsSold,
        isCompleted: blockchainRaffle.isCompleted,
        winner: blockchainRaffle.winner
      };
      
      return res.status(200).json({
        success: true,
        data: mergedData
      });
    } catch (blockchainError) {
      console.error("Error fetching blockchain data:", blockchainError);
      
      // Return database data if blockchain fetch fails
      return res.status(200).json({
        success: true,
        data: raffle,
        blockchainError: "Failed to fetch blockchain data"
      });
    }
  } catch (error) {
    console.error("Error fetching raffle:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch raffle",
      error: error.message
    });
  }
};

// Update raffle
export const updateRaffle = async (req, res) => {
  try {
    const { raffleId } = req.params;
    const { 
      name, 
      description, 
      category 
    } = req.body;

    const raffle = await Raffle.findOne({ raffleId: parseInt(raffleId) });
    
    if (!raffle) {
      return res.status(404).json({
        success: false,
        message: "Raffle not found"
      });
    }

    // Check if raffle has already started
    const now = Math.floor(Date.now() / 1000);
    if (raffle.startTime < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot update a raffle that has already started"
      });
    }

    // Update fields if provided
    if (name) raffle.name = name;
    if (description) raffle.description = description;
    if (category) raffle.category = category;

    // Process new image if uploaded
    if (req.files && req.files.image) {
      const result = await cloudinary.uploader.upload(req.files.image[0].path, {
        folder: "stakewise/raffles",
      });
      raffle.imageURL = result.secure_url;
    }

    // Process new notification image if uploaded
    if (req.files && req.files.notificationImage) {
      const result = await cloudinary.uploader.upload(req.files.notificationImage[0].path, {
        folder: "stakewise/raffles/notifications",
      });
      raffle.notificationImageURL = result.secure_url;
    }

    await raffle.save();

    return res.status(200).json({
      success: true,
      message: "Raffle updated successfully",
      data: raffle
    });
  } catch (error) {
    console.error("Error updating raffle:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update raffle",
      error: error.message
    });
  }
};

// Delete raffle
export const deleteRaffle = async (req, res) => {
  try {
    const { raffleId } = req.params;
    
    const raffle = await Raffle.findOne({ raffleId: parseInt(raffleId) });
    
    if (!raffle) {
      return res.status(404).json({
        success: false,
        message: "Raffle not found"
      });
    }

    // Check if raffle has already started
    const now = Math.floor(Date.now() / 1000);
    if (raffle.startTime < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a raffle that has already started"
      });
    }

    await Raffle.deleteOne({ raffleId: parseInt(raffleId) });

    return res.status(200).json({
      success: true,
      message: "Raffle deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting raffle:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete raffle",
      error: error.message
    });
  }
};

// Get active raffles (not ended and not completed)
export const getActiveRaffles = async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    const activeRaffles = await Raffle.find({
      endTime: { $gt: now },
      isCompleted: false
    }).sort({ endTime: 1 });
    
    return res.status(200).json({
      success: true,
      count: activeRaffles.length,
      data: activeRaffles
    });
  } catch (error) {
    console.error("Error fetching active raffles:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active raffles",
      error: error.message
    });
  }
};

// Select winner for a raffle
export const selectWinner = async (req, res) => {
  try {
    const { raffleId } = req.params;
    
    // Check if raffle exists in database
    const raffle = await Raffle.findOne({ raffleId: parseInt(raffleId) });
    
    if (!raffle) {
      return res.status(404).json({
        success: false,
        message: "Raffle not found"
      });
    }

    // Check if raffle has ended
    const now = Math.floor(Date.now() / 1000);
    if (raffle.endTime > now) {
      return res.status(400).json({
        success: false,
        message: "Cannot select winner before raffle has ended"
      });
    }

    // Check if winner already selected
    if (raffle.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Winner has already been selected for this raffle"
      });
    }

    // Select winner on blockchain
    try {
      const winnerResult = await raffleBlockchainService.selectWinner(raffleId);
      
      // Update database with winner information
      raffle.isCompleted = true;
      raffle.winner = winnerResult.winner;
      await raffle.save();
      
      return res.status(200).json({
        success: true,
        message: "Winner selected successfully",
        data: {
          raffleId: raffle.raffleId,
          name: raffle.name,
          winner: winnerResult.winner,
          prizeAmount: raffle.prizeAmount
        }
      });
    } catch (blockchainError) {
      console.error("Blockchain error selecting winner:", blockchainError);
      return res.status(500).json({
        success: false,
        message: "Failed to select winner on blockchain",
        error: blockchainError.message
      });
    }
  } catch (error) {
    console.error("Error selecting winner:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to select winner",
      error: error.message
    });
  }
};

// Get user's tickets for a raffle
export const getUserTickets = async (req, res) => {
  try {
    const { raffleId } = req.params;
    const userAddress = req.user.walletAddress;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address not found"
      });
    }
    
    try {
      const tickets = await raffleBlockchainService.getUserTickets(raffleId, userAddress);
      
      return res.status(200).json({
        success: true,
        count: tickets.length,
        data: tickets
      });
    } catch (blockchainError) {
      console.error("Blockchain error fetching tickets:", blockchainError);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch tickets from blockchain",
        error: blockchainError.message
      });
    }
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user tickets",
      error: error.message
    });
  }
};