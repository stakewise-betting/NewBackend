import mongoose from "mongoose";
import "dotenv/config";
import app from "./app.js";
import config from "./config/config.js";
import { initializeWebSocket } from "./services/websocketService.js";
import { setupBlockchainListeners } from "./services/blockchainService.js";
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

export { io };
// Initialize WebSocket
initializeWebSocket(server);

// MongoDB Connection
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log("MongoDB Connected");

    // Setup Blockchain Event Listeners AFTER MongoDB connection is established
    setupBlockchainListeners();

    server.listen(config.port, () => {
      console.log(`Server started on port ${config.port}`);
    });
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));
