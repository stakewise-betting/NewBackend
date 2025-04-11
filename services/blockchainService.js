// services/blockchainService.js

import Web3 from 'web3';
import mongoose from 'mongoose';
import EventModel from '../models/event.js';
import NotificationModel from '../models/notification.js';
import User from '../models/userModel.js';
import config from '../config/config.js';
import { sendNotificationToClients } from './websocketService.js';

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

                    // Get all users
                    const users = await User.find({}, "_id");

                    
                    // Create notification in database for all users
                    const newNotification = new NotificationModel({
                        userIds: users.map(user => user._id),
                        message: notificationMessage || `New event: ${eventDetails.name}`,
                        image: notificationImageURL
                    });

                    await newNotification.save();
                    console.log("Notification saved to database:", newNotification);

                    const eventDataForNotification = {
                        eventId: eventDetails.eventId,
                        name: eventDetails.name,
                        startTime: eventDetails.startTime,
                        endTime: eventDetails.endTime,
                        notificationMessage: notificationMessage,
                        notificationImageURL: notificationImageURL
                    };

                    // Send notification to all clients
                    sendNotificationToClients({
                        type: 'newEvent',
                        notificationMessage: notificationMessage,
                        notificationImageURL: notificationImageURL,
                        eventData: eventDataForNotification,
                        id: newNotification._id.toString(),
                        timestamp: newNotification.createdAt
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

export { setupBlockchainListeners };