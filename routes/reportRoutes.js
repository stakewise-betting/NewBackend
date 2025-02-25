const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const Event = require("../models/event"); // Import Event model

const router = express.Router();

// API to generate and download a betting report in PDF format
router.get("/pdf", async (req, res) => {
    try {
        // Fetch all events from the database
        const events = await Event.find();

        if (events.length === 0) {
            return res.status(404).json({ message: "No events found to generate a report." });
        }

        // Create a new PDF document
        const doc = new PDFDocument({ margin: 30 });
        const filePath = path.join(__dirname, "../betting_report.pdf");

        // Pipe PDF to a file
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // **Title Section**
        doc.fontSize(22).text("Betting Platform Report", { align: "center", underline: true });
        doc.moveDown();

        // **Table Header**
        doc.fontSize(16).text("Event Report", { align: "left", underline: true });
        doc.moveDown();

        // **Loop through events and add details to the PDF**
        events.forEach((event, index) => {
            doc.fontSize(14).text(`Event ${index + 1}: ${event.name}`);
            doc.fontSize(12).text(`ID: ${event.eventId}`);
            doc.text(`Description: ${event.description}`);
            doc.text(`Start Time: ${new Date(event.startTime).toLocaleString()}`);
            doc.text(`End Time: ${new Date(event.endTime).toLocaleString()}`);
            doc.text(`Notification: ${event.notificationMessage}`);
            doc.text(`Created At: ${new Date(event.createdAt).toLocaleString()}`);

            // **Options List**
            doc.text("Options:");
            event.options.forEach((option, i) => {
                doc.text(`   • ${option}`);
            });

            // **Event Image URL (Text Only)**
            doc.text(`Image URL: ${event.imageURL}`);

            doc.moveDown();
            doc.moveDown();
        });

        // Finalize the PDF
        doc.end();

        // Once the PDF is written, send it to the client
        writeStream.on("finish", () => {
            res.download(filePath, "betting_report.pdf", (err) => {
                if (err) {
                    console.error("Error sending the file:", err);
                    res.status(500).json({ message: "Error downloading the report" });
                }
            });
        });
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
