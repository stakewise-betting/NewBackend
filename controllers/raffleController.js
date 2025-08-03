//NewBackend/controllers/raffleController.js
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

//NewBackend/controllers/raffleController.js - ADD THESE FUNCTIONS

// Get all raffles with optional filtering
export const getAllRafflesWithFilter = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Search by name (case-insensitive)
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Filter by status (active, upcoming, ended)
    if (status && status !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      
      switch (status) {
        case 'active':
          filter.startTime = { $lte: now };
          filter.endTime = { $gt: now };
          break;
        case 'upcoming':
          filter.startTime = { $gt: now };
          break;
        case 'ended':
          filter.endTime = { $lte: now };
          break;
      }
    }

    // Execute query with sorting
    const raffles = await Raffle.find(filter).sort({ 
      createdAt: -1 // Most recent first
    });

    // Additional client-side sorting can be applied for more complex logic
    const now = Math.floor(Date.now() / 1000);
    
    raffles.sort((a, b) => {
      const getStatus = (raffle) => {
        if (now < raffle.startTime) return 'upcoming';
        if (now > raffle.endTime) return 'ended';
        return 'active';
      };

      const statusA = getStatus(a);
      const statusB = getStatus(b);
      const statusOrder = { 'active': 1, 'upcoming': 2, 'ended': 3 };

      if (statusA !== statusB) {
        return statusOrder[statusA] - statusOrder[statusB];
      }

      // Secondary sorting within same status
      switch (statusA) {
        case 'active':
          return a.endTime - b.endTime; // Soonest to end first
        case 'upcoming':
          return a.startTime - b.startTime; // Soonest to start first
        case 'ended':
          return b.endTime - a.endTime; // Most recently ended first
        default:
          return 0;
      }
    });

    res.status(200).json({
      success: true,
      count: raffles.length,
      data: raffles,
      filters: {
        search: search || '',
        category: category || 'all',
        status: status || 'all'
      }
    });

  } catch (error) {
    console.error("Error fetching filtered raffles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch raffles",
      error: error.message,
    });
  }
};

// Get unique categories from all raffles
export const getRaffleCategories = async (req, res) => {
  try {
    const categories = await Raffle.distinct('category');
    
    // Filter out null/empty categories and sort
    const validCategories = categories
      .filter(cat => cat && cat.trim())
      .sort();

    res.status(200).json({
      success: true,
      data: validCategories,
      count: validCategories.length
    });

  } catch (error) {
    console.error("Error fetching raffle categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// Advanced search with multiple filters
export const searchRaffles = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      minPrize, 
      maxPrize, 
      minTicketPrice, 
      maxTicketPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build aggregation pipeline
    let pipeline = [];

    // Match stage for filtering
    let matchStage = {};
    
    if (search && search.trim()) {
      matchStage.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      matchStage.category = category;
    }

    // Prize amount filtering (convert string to number for comparison)
    if (minPrize || maxPrize) {
      matchStage.$expr = {};
      if (minPrize) {
        matchStage.$expr.$gte = [{ $toDouble: "$prizeAmount" }, parseFloat(minPrize)];
      }
      if (maxPrize) {
        if (matchStage.$expr.$gte) {
          matchStage.$expr = {
            $and: [
              matchStage.$expr,
              { $lte: [{ $toDouble: "$prizeAmount" }, parseFloat(maxPrize)] }
            ]
          };
        } else {
          matchStage.$expr.$lte = [{ $toDouble: "$prizeAmount" }, parseFloat(maxPrize)];
        }
      }
    }

    // Ticket price filtering
    if (minTicketPrice || maxTicketPrice) {
      if (!matchStage.$expr) matchStage.$expr = {};
      
      if (minTicketPrice) {
        const priceCondition = { $gte: [{ $toDouble: "$ticketPrice" }, parseFloat(minTicketPrice)] };
        if (matchStage.$expr.$and) {
          matchStage.$expr.$and.push(priceCondition);
        } else if (Object.keys(matchStage.$expr).length > 0) {
          matchStage.$expr = { $and: [matchStage.$expr, priceCondition] };
        } else {
          matchStage.$expr = priceCondition;
        }
      }
      
      if (maxTicketPrice) {
        const priceCondition = { $lte: [{ $toDouble: "$ticketPrice" }, parseFloat(maxTicketPrice)] };
        if (matchStage.$expr.$and) {
          matchStage.$expr.$and.push(priceCondition);
        } else if (Object.keys(matchStage.$expr).length > 0) {
          matchStage.$expr = { $and: [matchStage.$expr, priceCondition] };
        } else {
          matchStage.$expr = priceCondition;
        }
      }
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add computed fields for sorting
    pipeline.push({
      $addFields: {
        prizeAmountNumeric: { $toDouble: "$prizeAmount" },
        ticketPriceNumeric: { $toDouble: "$ticketPrice" },
        status: {
          $let: {
            vars: { now: Math.floor(Date.now() / 1000) },
            in: {
              $cond: [
                { $lt: ["$$now", "$startTime"] },
                "upcoming",
                {
                  $cond: [
                    { $gt: ["$$now", "$endTime"] },
                    "ended",
                    "active"
                  ]
                }
              ]
            }
          }
        }
      }
    });

    // Sort stage
    let sortStage = {};
    switch (sortBy) {
      case 'prizeAmount':
        sortStage.prizeAmountNumeric = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'ticketPrice':
        sortStage.ticketPriceNumeric = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'endTime':
        sortStage.endTime = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'totalTicketsSold':
        sortStage.totalTicketsSold = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortStage.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute aggregation
    const raffles = await Raffle.aggregate(pipeline);
    
    // Get total count for pagination
    const totalPipeline = pipeline.slice(0, -2); // Remove skip and limit
    totalPipeline.push({ $count: "total" });
    const totalResult = await Raffle.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: raffles,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        search,
        category,
        minPrize,
        maxPrize,
        minTicketPrice,
        maxTicketPrice,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error("Error in advanced raffle search:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search raffles",
      error: error.message,
    });
  }
};