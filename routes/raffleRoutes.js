import express from "express";
import multer from "multer";
import { uploadRaffleImage } from "../controllers/raffleController.js";
import adminAuth from "../middleware/adminAuth.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

// Configure multer for single image upload to disk storage
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Route for admin to upload a raffle image.
// It's protected to ensure only authenticated admins can upload.
router.post("/upload-image", userAuth, adminAuth, upload.single('image'), uploadRaffleImage);

export default router;