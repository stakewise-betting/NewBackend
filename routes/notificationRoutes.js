// routes/notificationRoutes.js

// const express = require('express');
// const notificationController = require('../controllers/notificationController');

import express from "express";
import {sendGenericNotification} from "../controllers/notificationController.js";

const router = express.Router();

router.post('/send',sendGenericNotification); // Changed endpoint to /send to avoid conflict

export default router;

