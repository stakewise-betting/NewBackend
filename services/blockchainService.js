// services/blockchainService.js

import Web3 from 'web3';
import mongoose from 'mongoose';
import EventModel from '../models/event.js';
import NotificationModel from '../models/notification.js';
import User from '../models/userModel.js';
import config from '../config/config.js';
import { sendNotificationToClients } from './websocketService.js';
import LeaderboardService from './leaderboardService.js';

let contractBackend;

const setupBlockchainListeners = () => {
    if (!config.blockchainProviderUrl) {
        console.error("BLOCKCHAIN_PROVIDER_URL is not defined in .env file.");
        process.exit(1);
    }

    const web3Backend = new Web3(new Web3.providers.WebsocketProvider(config.blockchainProviderUrl));
    contractBackend = new web3Backend.eth.Contract(config.contractABI, config.contractAddress);

    // Listen for EventCreated events
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

                    const notificationImageURL = eventDetails.notificationImageURL;
                    const eventId = eventDetails.eventId;
                   
                    // Get all users
                    const users = await User.find({}, "_id");
                    
                    // Create notification in database for all users
                    const newNotification = new NotificationModel({
                        userIds: users.map(user => user._id),
                        message: notificationMessage ,
                        image: notificationImageURL,
                        eventId: eventId
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

    // Listen for WinnerDeclared events
    contractBackend.events.WinnerDeclared({})
        .on('data', async (event) => {
            console.log('--- WinnerDeclared event DETECTED ---');
            console.log('Full Event Data:', event);
            const eventId = event.returnValues.eventId;
            const winningOption = event.returnValues.winningOption;

            console.log(`Event ${eventId} settled with winning option: ${winningOption}`);

            try {
                // Update event in database
                await EventModel.findOneAndUpdate(
                    { eventId: Number(eventId) },
                    { 
                        isCompleted: true, 
                        winningOption: winningOption,
                        updatedAt: new Date()
                    }
                );

                // Update user stats for all users who bet on this event
                await updateUserStatsForEvent(eventId);

                console.log(`Successfully updated stats for event ${eventId}`);
            } catch (error) {
                console.error('Error updating user stats after event settlement:', error);
            }
        })
        .on('error', (error) => {
            console.error('Error listening to WinnerDeclared event:', error);
        });
};

// Function to update user stats for a specific event
const updateUserStatsForEvent = async (eventId) => {
    try {
        console.log(`Updating user stats for event ${eventId}...`);

        // Get all users who bet on this event
        const betEvents = await contractBackend.getPastEvents("BetPlaced", {
            filter: { eventId },
            fromBlock: 0,
            toBlock: "latest"
        });

        const uniqueUsers = [...new Set(betEvents.map(event => event.returnValues.bettor))];
        console.log(`Found ${uniqueUsers.length} unique users who bet on event ${eventId}`);

        // Update stats for each user
        const updatePromises = uniqueUsers.map(userAddress => 
            LeaderboardService.updateUserStats(userAddress)
        );

        await Promise.all(updatePromises);

        // Update ranks after all stats are updated
        await LeaderboardService.updateRanks();

        console.log(`Successfully updated stats for ${uniqueUsers.length} users for event ${eventId}`);
    } catch (error) {
        console.error(`Error updating user stats for event ${eventId}:`, error);
        throw error;
    }
};

export { setupBlockchainListeners, updateUserStatsForEvent };