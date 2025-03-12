// const http = require('http');
// const mongoose = require('mongoose');
// const app = require('./app'); // Import the Express app
// const config = require('./config/config');
// const websocketService = require('./services/websocketService');
// const blockchainService = require('./services/blockchainService');

import mongoose from 'mongoose';
import "dotenv/config";
import app from './app.js';
import config from './config/config.js';
import {initializeWebSocket} from './services/websocketService.js'
import {setupBlockchainListeners} from './services/blockchainService.js'
import http from 'http';


const server = http.createServer(app);


// Initialize WebSocket
initializeWebSocket(server);

// MongoDB Connection
mongoose.connect(config.mongodbUri)
    .then(() => {
        console.log('MongoDB Connected');

        // Setup Blockchain Event Listeners AFTER MongoDB connection is established
        setupBlockchainListeners();

        server.listen(config.port, () => {
            console.log(`Server started on port ${config.port}`);
        });
    })
    .catch(err => console.error('MongoDB Connection Error:', err));



