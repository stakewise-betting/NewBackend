import express from "express";
import multer from "multer";
import authenticate from "../middleware/userAuth.js";
import { 
  createRaffle, 
  getAllRaffles, 
  getRaffleById, 
  updateRaffle, 
  deleteRaffle, 
  getActiveRaffles,
  selectWinner,
  getUserTickets
} from "../controllers/raffleController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Configure multer fields for multiple file uploads
const uploadFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "notificationImage", maxCount: 1 }
]);

// Admin routes (require authentication)
router.post("/", authenticate, uploadFiles, createRaffle);
router.put("/:raffleId", authenticate, uploadFiles, updateRaffle);
router.delete("/:raffleId", authenticate, deleteRaffle);
router.post("/:raffleId/select-winner", authenticate, selectWinner);

// Public routes
router.get("/", getAllRaffles);
router.get("/active", getActiveRaffles);
router.get("/:raffleId", getRaffleById);

// User routes (require authentication)
router.get("/:raffleId/tickets", authenticate, getUserTickets);

export default router;