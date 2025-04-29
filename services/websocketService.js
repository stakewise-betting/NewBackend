// services/websocketService.js

import { WebSocketServer } from 'ws';

let wss;

const initializeWebSocket = (server) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        console.log('Client connected');
        
        // Extract user ID from the URL query parameters
        // Example URL: ws://localhost:5000/?userId=12345
        const userId = new URL(req.url, 'http://localhost').searchParams.get('userId');
        
        if (userId) {
            ws.userId = userId;
            console.log(`Client identified with userId: ${userId}`);
        }

        ws.on('message', (message) => {
            console.log(`Received message: ${message}`);
            
            // Broadcasting logic (if needed)
            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === ws.OPEN) {
                    client.send(`Server says: ${message}`);
                }
            });
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    console.log('WebSocket server initialized');
    return wss;
};

const getWssInstance = () => {
    if (!wss) {
        throw new Error("WebSocket server not initialized. Call initializeWebSocket first.");
    }
    return wss;
};

// Send to all clients
const sendNotificationToClients = (payload) => {
    if (!wss) {
        console.error("WebSocket server not initialized.");
        return;
    }
    
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
};

// Send to specific user by userId
const sendNotificationToUser = (userId, payload) => {
    if (!wss) {
        console.error("WebSocket server not initialized.");
        return;
    }
    
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN && client.userId === userId) {
            client.send(JSON.stringify(payload));
        }
    });
};

export { 
    initializeWebSocket, 
    getWssInstance, 
    sendNotificationToClients,
    sendNotificationToUser
};