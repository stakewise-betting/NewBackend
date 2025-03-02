// server.js
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app'); // Import the Express app
const config = require('./config/config');
const websocketService = require('./services/websocketService');
const blockchainService = require('./services/blockchainService');

const server = http.createServer(app);

// Initialize WebSocket
websocketService.initializeWebSocket(server);

// MongoDB Connection
mongoose.connect(config.mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB Connected');

    // Setup Blockchain Event Listeners AFTER MongoDB connection is established
    blockchainService.setupBlockchainListeners();

    server.listen(config.port, () => {
        console.log(`Server started on port ${config.port}`);
    });
})
.catch(err => console.error('MongoDB Connection Error:', err));