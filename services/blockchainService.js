// services/blockchainService.js
const Web3 = require('web3');
const mongoose = require('mongoose'); // Import mongoose here as well
const EventModel = require('../models/event'); // Import Event model
const config = require('../config/config');
const websocketService = require('./websocketService');


let contractBackend;

const setupBlockchainListeners = () => {
    if (!config.blockchainProviderUrl) {
        console.error("BLOCKCHAIN_PROVIDER_URL is not defined in .env file.");
        process.exit(1);
    }

    const web3Backend = new Web3(new Web3.providers.WebsocketProvider(config.blockchainProviderUrl));
    contractBackend = new web3Backend.eth.Contract(config.contractABI, config.contractAddress);

    contractBackend.events.EventCreated({})
        .on('data', async (event) => {
            console.log('--- EventCreated event DETECTED ---');
            console.log('Full Event Data:', event);
            const newEventId = event.returnValues.eventId;

            console.log("newEventId from event:", newEventId, typeof newEventId);

            setTimeout(async () => {
                try {
                    const eventIdNumber = Number(newEventId);
                    console.log("eventIdNumber (converted):", eventIdNumber, typeof eventIdNumber);

                    const eventDetails = await contractBackend.methods.getEvent(eventIdNumber).call();
                    const notificationMessage = eventDetails.notificationMessage;

                    console.log('Notification message from contract:', notificationMessage);

                    const eventFromDb = await EventModel.findOne({ eventId: eventIdNumber });
                    console.log("eventFromDb from MongoDB:", eventFromDb);

                    const notificationImageURL = eventFromDb ? eventFromDb.notificationImageURL : null;
                    console.log("notificationImageURL from MongoDB:", notificationImageURL);


                    const eventDataForNotification = {
                        eventId: eventDetails.eventId,
                        name: eventDetails.name,
                        startTime: eventDetails.startTime,
                        endTime: eventDetails.endTime,
                        notificationMessage: notificationMessage,
                        notificationImageURL: notificationImageURL
                    };

                    websocketService.sendNotificationToClients({
                        type: 'newEvent',
                        notificationMessage: notificationMessage,
                        notificationImageURL: notificationImageURL,
                        eventData: eventDataForNotification
                    });

                } catch (error) {
                    console.error('Error fetching event details, MongoDB data or sending notification:', error);
                }
            }, 2000);
        })
        .on('error', (error) => {
            console.error('Error listening to EventCreated event:', error);
        });
};

module.exports = { setupBlockchainListeners };