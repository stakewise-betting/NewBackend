// services/blockchainService.js

import Web3 from 'web3';
import EventModel from '../models/event.js';
import config from '../config/config.js';

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
                    console.log('Event details from contract:', eventDetails);
                } catch (error) {
                    console.error('Error fetching event details:', error);
                }
            }, 2000);
        })
        .on('error', (error) => {
            console.error('Error listening to EventCreated event:', error);
        });
};

export { setupBlockchainListeners };
