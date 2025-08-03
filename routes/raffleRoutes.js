// //Newbackend/routes/raffleRoutes.js
// import express from "express";
// import multer from "multer";
// import { uploadRaffleImage } from "../controllers/raffleController.js";
// import adminAuth from "../middleware/adminAuth.js";
// import userAuth from "../middleware/userAuth.js";

// const router = express.Router();

// // Configure multer for single image upload to disk storage
// const storage = multer.diskStorage({});
// const upload = multer({ storage });

// // Route for admin to upload a raffle image.
// // It's protected to ensure only authenticated admins can upload.
// router.post("/upload-image", userAuth, adminAuth, upload.single('image'), uploadRaffleImage);

// export default router;



//NewBackend/routes/raffleRoutes.js - UPDATED VERSION
import express from "express";
import multer from "multer";
import { 
  uploadRaffleImage, 
  saveRaffleToDB, 
  getAllRafflesFromDB,
  getAllRafflesWithFilter,
  getRaffleCategories,
  searchRaffles
} from "../controllers/raffleController.js";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

// Configure multer for single image upload to disk storage
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Route for admin to upload a raffle image.
// It's protected to ensure only authenticated admins can upload.
router.post("/upload-image", userAuth, adminAuth, upload.single('image'), uploadRaffleImage);

// Route to save raffle data to database (admin only)
router.post("/save-to-db", userAuth, adminAuth, upload.single('image'), saveRaffleToDB);

// Public routes for getting raffle data

// Get all raffles (basic endpoint)
router.get("/all", getAllRafflesFromDB);

// Get raffles with filtering support
router.get("/filter", getAllRafflesWithFilter);

// Get unique categories
router.get("/categories", getRaffleCategories);

// Advanced search endpoint
router.get("/search", searchRaffles);

export default router;