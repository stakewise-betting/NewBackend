// config/config.js
const config = {
    mongodbUri: process.env.MONGODB_URI,
    port: process.env.PORT || 5000,
    blockchainProviderUrl: process.env.BLOCKCHAIN_PROVIDER_URL,
    contractAddress: "0x3af3D7026131cebB9fA1EbFCe44b7fA5F426758d", // Keep contract address here if it's config
    contractABI:  [
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
            "name": "rules",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "notificationImageURL",
            "type": "string"
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
        "inputs": [],
        "name": "totalAdminProfit",
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
            "name": "_rules",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "_notificationImageURL",
            "type": "string"
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
            "components": [
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
                "name": "rules",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "notificationImageURL",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "notificationMessage",
                "type": "string"
              }
            ],
            "internalType": "struct BettingEvents.BetEventView",
            "name": "",
            "type": "tuple"
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
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_eventId",
            "type": "uint256"
          }
        ],
        "name": "getEventPrizePool",
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
          }
        ],
        "name": "getEventOdds",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "optionName",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "oddsPercentage",
                "type": "uint256"
              }
            ],
            "internalType": "struct BettingEvents.OptionOdds[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
      },
      {
        "inputs": [],
        "name": "getTotalAdminProfit",
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
      }
    ],
};

export default config;
