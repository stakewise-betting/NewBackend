//resultRoutes.js
import express from "express";
import {
  saveResult,
  saveBatchResults, // Add this new import
  getAllResults,
  getResultByEventId,
} from "../controllers/resultController.js";

const router = express.Router();

// Save a new result
router.post("/save-result", saveResult);

// Save multiple results in batch (ADD THIS NEW ROUTE)
router.post("/save-batch-results", saveBatchResults);

// Get all results
router.get("/all", getAllResults);

// Get result by event ID
router.get("/:eventId", getResultByEventId);

export default router;