import Raffle from "../models/raffleModel.js";
import cloudinary from "../config/cloudinaryConfig.js";



// This controller now only handles saving confirmed raffle data.
// The creation logic is on the frontend, which calls the blockchain.
export const saveRaffleToDB = async (req, res) => {
  try {
    const {
      raffleId,
      name,
      category,
      startTime,
      endTime,
      ticketPrice, // Expecting value in ETH string from frontend
      prizeAmount // Expecting value in ETH string from frontend
    } = req.body;
    let imageURL = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "stakewise/raffles",
      });
      imageURL = result.secure_url;
    } else {
      return res.status(400).json({ success: false, message: "Raffle image is required." });
    }

    // Check if raffle already exists in DB
    const existingRaffle = await Raffle.findOne({ raffleId });
    if (existingRaffle) {
      return res.status(409).json({ success: false, message: "Raffle with this ID already saved." });
    }
    const newRaffle = new Raffle({
      raffleId,
      name,
      imageURL,
      category,
      startTime,
      endTime,
      ticketPrice,
      prizeAmount,
    });

    await newRaffle.save();
    res.status(201).json({
      success: true,
      message: "Raffle data saved successfully to the database.", 
      raffle: newRaffle,
    });

  } catch (error) {
    console.error("Error saving raffle to DB:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving raffle.",
      error: error.message,
    });
  }
};


// Controller to handle image upload to Cloudinary and return the URL
export const uploadRaffleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "stakewise/raffles", // Organize uploads in Cloudinary
    });

    // Send back the secure URL
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully.",
      imageURL: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading raffle image:", error);
    res.status(500).json({
      success: false,
      message: "Server error during image upload.",
      error: error.message,
    });
  }
};


// Function to get all raffles from the database (for admin backend, not for main app functionality)
export const getAllRafflesFromDB = async (req, res) => {
  try {
    const raffles = await Raffle.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: raffles.length,
      data: raffles,
    });

  } catch (error) {
    console.error("Error fetching raffles from DB:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch raffles from database",
      error: error.message,
    });
  }
}