//services/raffleBlockchainService.js
import Web3 from 'web3';
import Raffle from '../models/raffleModel.js';
import config from '../config/config.js';

// --- START OF CORRECTION ---
// Correctly import the default export from raffleConfig.js
import raffleConfig from '../config/raffleConfig.js';
// Then, destructure the variables we need from the imported object
const { raffleContractABI, raffleContractAddress } = raffleConfig;
// --- END OF CORRECTION ---

let raffleContract;

// Initialize Web3 with a WebsocketProvider for event listening
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.blockchainProviderUrl));

export const setupRaffleListeners = () => {
    if (!config.blockchainProviderUrl) {
        console.error("BLOCKCHAIN_PROVIDER_URL is not defined in .env file.");
        return;
    }

    raffleContract = new web3.eth.Contract(raffleContractABI, raffleContractAddress);

    console.log("Setting up RaffleDraw contract listeners...");

    // Listener for RaffleCreated events
    raffleContract.events.RaffleCreated({})
        .on('data', async (event) => {
            console.log('--- RaffleCreated event DETECTED --- Saving to DB...');
            const { raffleId } = event.returnValues;

            try {
                // Check if this raffle is already in the DB to prevent duplicates
                const existingRaffle = await Raffle.findOne({ raffleId: Number(raffleId) });
                if (existingRaffle) {
                    console.log(`Raffle ${raffleId} already exists in the DB. Skipping save.`);
                    return;
                }
                
                // Fetch the full, confirmed raffle data from the blockchain
                const raffleDataFromChain = await raffleContract.methods.getRaffle(raffleId).call();

                // Create a new document in the database
                const newRaffle = new Raffle({
                    raffleId: Number(raffleDataFromChain.raffleId),
                    name: raffleDataFromChain.name,
                    imageURL: raffleDataFromChain.imageURL,
                    category: raffleDataFromChain.category,
                    startTime: Number(raffleDataFromChain.startTime),
                    endTime: Number(raffleDataFromChain.endTime),
                    // Convert ticketPrice and prizeAmount from Wei back to ETH string for storage
                    ticketPrice: web3.utils.fromWei(raffleDataFromChain.ticketPrice.toString(), 'ether'),
                    prizeAmount: web3.utils.fromWei(raffleDataFromChain.prizeAmount.toString(), 'ether'),
                });

                await newRaffle.save();
                console.log(`Successfully saved new raffle ${raffleId} to the database.`);

            } catch (error) {
                console.error(`Error saving raffle ${raffleId} to DB from listener:`, error);
            }
        })
        .on('error', (error) => {
            console.error('Error listening to RaffleCreated event:', error);
        });

    // Listener for WinnerDrawn events
    raffleContract.events.WinnerDrawn({})
        .on('data', async (event) => {
            console.log('--- WinnerDrawn event DETECTED ---');
            const { raffleId, winner } = event.returnValues;

            try {
                const raffleFromChain = await raffleContract.methods.getRaffle(raffleId).call();
                await Raffle.findOneAndUpdate(
                    { raffleId: Number(raffleId) },
                    { 
                        isCompleted: true, 
                        winnerWalletAddress: winner,
                        totalTicketsSold: Number(raffleFromChain.totalTicketsSold)
                    },
                    { new: true }
                );
                console.log(`Raffle ${raffleId} updated in DB. Winner: ${winner}`);
            } catch (error) {
                console.error(`Error updating raffle ${raffleId} in DB after winner draw:`, error);
            }
        })
        .on('error', (error) => {
            console.error('Error listening to WinnerDrawn event:', error);
        });
};