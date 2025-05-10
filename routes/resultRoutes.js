import express from "express";
import {
  saveResult,
  getAllResults,
  getResultByEventId,
} from "../controllers/resultController.js";

const router = express.Router();

// Save a new result
router.post("/save-result", saveResult);

// Get all results
router.get("/all", getAllResults);

// Get result by event ID
router.get("/:eventId", getResultByEventId);

export default router;