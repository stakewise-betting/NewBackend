// controllers/notificationController.js
const websocketService = require('../services/websocketService');

const sendGenericNotification = (req, res) => {
    const message = req.body.message;
    const notificationImageURL = req.body.notificationImageURL;

    if (!message) {
        return res.status(400).send({ message: 'Notification message is required' });
    }

    websocketService.sendNotificationToClients({
        type: 'notification',
        message: message,
        notificationImageURL: notificationImageURL || null
    });

    res.status(200).send({ message: 'Notification sent to all clients' });
};

module.exports = { sendGenericNotification };