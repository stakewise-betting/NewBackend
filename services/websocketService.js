// services/websocketService.js
const WebSocket = require('ws');

let wss;

const initializeWebSocket = (server) => {
    wss = new WebSocket.Server({ server });

    wss.on('connection', ws => {
        console.log('Client connected');

        ws.on('message', message => {
            console.log(`Received message: ${message}`);
            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(`Server says: ${message}`);
                }
            });
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });

        ws.on('error', error => {
            console.error('WebSocket error:', error);
        });
    });

    console.log('WebSocket server initialized');
    return wss; // Export wss instance if needed elsewhere
};

const getWssInstance = () => {
    if (!wss) {
        throw new Error("WebSocket server not initialized. Call initializeWebSocket first.");
    }
    return wss;
};


const sendNotificationToClients = (payload) => {
    if (!wss) {
        console.error("WebSocket server not initialized.");
        return;
    }
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
};

module.exports = { initializeWebSocket, getWssInstance, sendNotificationToClients };