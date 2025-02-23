require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');
const Web3 = require('web3'); // Import Web3

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const Event = require('./models/event');

// MongoDB Connection (Keep your existing MongoDB connection)
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// **Blockchain Setup**
const contractAddress = "0x904d11bEEbFc370D2fC0A7ba256A44c5d9e665A9";
const contractABI =  [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "eventId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "option",
        "type": "string"
      }
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "eventId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      }
    ],
    "name": "EventCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "eventId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "winningOption",
        "type": "string"
      }
    ],
    "name": "WinnerDeclared",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "events",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "eventId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageURL",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isCompleted",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "winningOption",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "prizePool",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "notificationMessage",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "nextEventId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_imageURL",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "_options",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "_startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_endTime",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_notificationMessage",
        "type": "string"
      }
    ],
    "name": "createEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_option",
        "type": "string"
      }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
    "payable": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_winningOption",
        "type": "string"
      }
    ],
    "name": "declareWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventId",
        "type": "uint256"
      }
    ],
    "name": "getEvent",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "eventId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageURL",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isCompleted",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "winningOption",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "prizePool",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "notificationMessage",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_eventId",
        "type": "uint256"
      }
    ],
    "name": "getEventOptions",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
];
const blockchainProviderUrl = process.env.BLOCKCHAIN_PROVIDER_URL; // Get provider URL from .env

if (!blockchainProviderUrl) {
    console.error("BLOCKCHAIN_PROVIDER_URL is not defined in .env file.");
    process.exit(1); // Exit if provider URL is missing
}

const web3Backend = new Web3(new Web3.providers.WebsocketProvider(blockchainProviderUrl)); // Initialize Web3 with provider URL
const contractBackend = new web3Backend.eth.Contract(contractABI, contractAddress);

// **Event Listener for EventCreated - Enhanced Logging**
contractBackend.events.EventCreated({})
    .on('data', async (event) => {
        console.log('--- EventCreated event DETECTED ---');
        console.log('Full Event Data:', event);
        const newEventId = event.returnValues.eventId; // Use eventId from event.returnValues (important!)

        console.log("newEventId from event:", newEventId, typeof newEventId); // Log newEventId and its type

        try {
            // **Convert newEventId to Number before calling getEvent**
            const eventIdNumber = Number(newEventId); 
            console.log("eventIdNumber (converted):", eventIdNumber, typeof eventIdNumber); // Log converted eventId

            const eventDetails = await contractBackend.methods.getEvent(eventIdNumber).call(); // Use Number, not string
            const notificationMessage = eventDetails.notificationMessage;

            console.log('Notification message from contract:', notificationMessage);

            const eventDataForNotification = {
                eventId: eventDetails.eventId, // Use eventId from eventDetails
                name: eventDetails.name,
                startTime: eventDetails.startTime,
                endTime: eventDetails.endTime,
                notificationMessage: notificationMessage
            };

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    const notificationPayload = JSON.stringify({
                        type: 'newEvent',
                        notificationMessage: notificationMessage,
                        eventData: eventDataForNotification
                    });
                    client.send(notificationPayload);
                }
            });

        } catch (error) {
            console.error('Error fetching event details or sending notification:', error);
        }
    })
    .on('error', (error) => {
        console.error('Error listening to EventCreated event:', error);
    });

    app.post('/api/events', async (req, res) => {
      try {
          const eventData = req.body; // Data from frontend NOW INCLUDES eventId
  
          console.log("Received eventData in /api/events:", eventData); // **Log eventData**
          console.log("eventData.eventId:", eventData.eventId);       // **Log eventData.eventId specifically**
  
          const newEvent = new Event({
              eventId: eventData.eventId, // Use eventId from req.body - IMPORTANT
              name: eventData.name,
              description: eventData.description,
              imageURL: eventData.imageURL,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              options: eventData.options,
              notificationMessage: eventData.notificationMessage,
          });
  
          await newEvent.save();
          console.log('Event saved to MongoDB:', newEvent);
          res.status(201).send({ message: 'Event saved to MongoDB', eventId: eventData.eventId });
      } catch (error) {
          console.error('Error saving event to MongoDB:', error);
          res.status(500).send({ message: 'Failed to save event to MongoDB', error: error });
      }
  });

// API endpoint to send a generic notification (Keep for testing)
app.post('/send-notification', (req, res) => {
    const message = req.body.message;
    if (!message) {
        return res.status(400).send({ message: 'Notification message is required' });
    }

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'notification', message: message }));
        }
    });

    res.status(200).send({ message: 'Notification sent to all clients' });
});

// WebSocket Connection Handling (Keep your existing WebSocket handling)
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


const port = process.env.PORT || 5000;

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});