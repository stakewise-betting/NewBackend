// routes/eventRoutes.js
import express from "express";
import { createEvent } from "../controllers/eventController.js";

const router = express.Router();

router.post('/', createEvent);

export default router;