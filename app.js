// app.js
const express = require('express');
const cors = require('cors');
const eventRoutes = require('./routes/eventRoutes'); // Import event routes
const notificationRoutes = require('./routes/notificationRoutes'); // Import notification routes
const reportRoutes = require('./routes/reportRoutes'); // Import report routes - already extracted

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventRoutes);       // Use event routes
app.use('/api/notifications', notificationRoutes); // Use notification routes
app.use("/api/report", reportRoutes);       // Use report routes - already extracted

module.exports = app;