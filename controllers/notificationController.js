// controllers/notificationController.js

import {sendNotificationToClients} from "../services/websocketService.js";

export const sendGenericNotification = (req, res) => {
    const message = req.body.message;
    const notificationImageURL = req.body.notificationImageURL;

    if (!message) {
        return res.status(400).send({ message: 'Notification message is required' });
    }


    sendNotificationToClients({
        type: 'notification',
        message: message,
        notificationImageURL: notificationImageURL || null
    });

    res.status(200).send({ message: 'Notification sent to all clients' });
};

