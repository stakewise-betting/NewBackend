// routes/notificationRoutes.js
const express = require('express');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.post('/send', notificationController.sendGenericNotification); // Changed endpoint to /send to avoid conflict

module.exports = router;