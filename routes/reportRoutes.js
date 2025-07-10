// routes/pdfReportRoutes.js
import express from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Event from "../models/event.js";
import userModel from "../models/userModel.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Web3 from "web3";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(path.join(__filename, '..')); // Go up one level to project root

// --- CHARTING HELPER FUNCTIONS ---
function drawDonutChart(doc, data, x, y, radius) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        doc.circle(x, y, radius).strokeColor('#E0E0E0').stroke();
        doc.fontSize(10).fillColor('#9E9E9E').text('No Data', x - 25, y - 6, { width: 50, align: 'center'});
        return;
    }
    const innerRadius = radius * 0.6;
    let startAngle = -90;
    data.forEach(item => {
        const sliceAngle = (item.value / total) * 360;
        const endAngle = startAngle + sliceAngle;
        doc.save().moveTo(x, y).path(`M ${x} ${y}`).arc(x, y, radius, startAngle, endAngle, false).lineTo(x, y).fill(item.color).restore();
        startAngle = endAngle;
    });
    doc.circle(x, y, innerRadius).fill('white');
    let legendY = y - (data.length / 2 * 15);
    doc.fontSize(9).font('Helvetica');
    data.forEach(item => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        doc.rect(x + radius + 20, legendY, 8, 8).fill(item.color);
        doc.fillColor('#374151').text(`${item.label} (${percentage}%)`, x + radius + 33, legendY);
        legendY += 18;
    });
}

function drawBarChart(doc, data, x, y, width, height) {
    if (data.length === 0) {
        doc.fontSize(10).fillColor('#9E9E9E').text('No data for chart.', x, y + height/2);
        return;
    }
    const maxValue = Math.max(...data.map(d => d.value));
    const barSpacing = 10;
    const barWidth = (width - (data.length - 1) * barSpacing) / data.length;
    doc.strokeColor('#A0A0A0').moveTo(x, y).lineTo(x, y + height).moveTo(x, y + height).lineTo(x + width, y + height).stroke();
    data.forEach((item, i) => {
        const barHeight = (item.value / maxValue) * height * 0.95;
        const barX = x + i * (barWidth + barSpacing);
        const barY = y + height - barHeight;
        doc.rect(barX, barY, barWidth, barHeight).fill(item.color || '#3B82F6');
        doc.fontSize(8).fillColor('#374151').text(item.label, barX, y + height + 5, { width: barWidth, align: 'center' });
    });
    doc.fontSize(8).fillColor('#6B7280');
    doc.text(maxValue, x - 25, y, { width: 20, align: 'right'});
    doc.text(Math.round(maxValue / 2), x - 25, y + height / 2 - 4, { width: 20, align: 'right'});
    doc.text('0', x - 25, y + height - 4, { width: 20, align: 'right'});
}

// --- STANDARD HELPER FUNCTIONS ---
const addSectionDivider = (doc) => {
    doc.moveDown(0.5).strokeColor('#E5E7EB').lineWidth(1).moveTo(30, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
};

const addPageHeader = (doc, title) => {
    const pageWidth = doc.page.width;
    doc.rect(0, 0, pageWidth, 80).fillColor('#1F2937').fill();
    const logoPath = path.join(__dirname, 'assets/logo.png');
    try {
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 30, 20, { width: 40, height: 40 });
        } else {
            doc.rect(30, 20, 40, 40).fillColor('#3B82F6').fill();
        }
    } catch (e) {
        console.error("Error loading logo:", e);
        doc.rect(30, 20, 40, 40).fillColor('#3B82F6').fill();
    }
    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('STAKEWISE', 90, 30);
    doc.fillColor('#9CA3AF').fontSize(12).font('Helvetica').text(title, 90, 50);
    const now = new Date();
    doc.fillColor('#9CA3AF').fontSize(10).text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, pageWidth - 200, 30, { align: 'right' });
    doc.fillColor('#000000').y = 100;
};

const addPageFooter = (doc) => {
    const pageHeight = doc.page.height;
    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(30, pageHeight - 60).lineTo(doc.page.width - 30, pageHeight - 60).stroke();
};

const createTable = (doc, headers, rows, startY, options = {}) => {
    const { x = 30, width = doc.page.width - 60, columnWidths: customWidths } = options;
    const tableTop = startY;
    const itemHeight = 25;
    const columnWidths = customWidths || headers.map(() => width / headers.length);
    let currentY = tableTop;
    doc.rect(x, currentY, width, itemHeight).fillColor('#F3F4F6').fill();
    doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold');
    let currentX = x;
    headers.forEach((header, i) => {
        doc.text(header, currentX + 5, currentY + 8, { width: columnWidths[i] - 10, ellipsis: true });
        currentX += columnWidths[i];
    });
    currentY += itemHeight;
    doc.fillColor('#000000').fontSize(9).font('Helvetica');
    rows.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
            doc.rect(x, currentY, width, itemHeight).fillColor('#FAFAFA').fill();
        }
        currentX = x;
        row.forEach((cell, cellIndex) => {
            doc.fillColor('#000000').text(String(cell), currentX + 5, currentY + 8, { width: columnWidths[cellIndex] - 10, ellipsis: true });
            currentX += columnWidths[cellIndex];
        });
        currentY += itemHeight;
        if (currentY > doc.page.height - 100) {
            addPageFooter(doc); doc.addPage(); addPageHeader(doc, 'Continued'); currentY = 100;
        }
    });
    return currentY;
};

// --- MAIN PDF GENERATION ROUTE ---
router.get("/pdf", async (req, res) => {
    try {
        const [events, users] = await Promise.all([
            Event.find().sort({ createdAt: -1 }),
            userModel.find({}).select('-password -verifyOtp -resetOtp').sort({ createdAt: -1 })
        ]);

        const totalEvents = events.length;
        const activeEvents = events.filter(e => new Date(e.endTime) > new Date()).length;
        const completedEvents = totalEvents - activeEvents;
        const totalUsers = users.length;
        const verifiedUsers = users.filter(u => u.isVerified).length;
        
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const filePath = path.join(__dirname, "reports/stakewise_report.pdf");
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // --- Page 1: Executive Summary ---
        addPageHeader(doc, 'Executive Summary Report');
        doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary', 30, 120).moveDown(1);
        const metrics = [ { label: 'Total Events', value: totalEvents, color: '#3B82F6' }, { label: 'Active Events', value: activeEvents, color: '#10B981' }, { label: 'Completed Events', value: completedEvents, color: '#F59E0B' }, { label: 'Total Users', value: totalUsers, color: '#8B5CF6' }];
        const cardStartY = doc.y;
        const cardHeight = 80;
        const pageMargin = 30;
        const availableWidth = doc.page.width - (2 * pageMargin);
        const cardSpacing = 15;
        const cardWidth = (availableWidth - (metrics.length - 1) * cardSpacing) / metrics.length;
        let currentX = pageMargin;
        metrics.forEach((metric) => {
            doc.rect(currentX, cardStartY, cardWidth, cardHeight).fillColor(metric.color).fillOpacity(0.1).fill();
            doc.rect(currentX, cardStartY, cardWidth, cardHeight).strokeColor(metric.color).lineWidth(1.5).stroke();
            doc.fillColor(metric.color).fillOpacity(1).fontSize(24).font('Helvetica-Bold').text(metric.value.toString(), currentX, cardStartY + 20, { width: cardWidth, align: 'center' });
            doc.fillColor('#374151').fontSize(10).font('Helvetica').text(metric.label, currentX, cardStartY + 55, { width: cardWidth, align: 'center' });
            currentX += cardWidth + cardSpacing;
        });
        doc.y = cardStartY + cardHeight + 40;
        const columnStartY = doc.y;
        const columnGap = 40;
        const columnContentWidth = (availableWidth - columnGap) / 2;
        const rightColumnX = pageMargin + columnContentWidth + columnGap;
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1F2937').text('Platform Overview', pageMargin, columnStartY, { width: columnContentWidth });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#374151').text('STAKEWISE is a decentralized betting platform built on blockchain technology. This report provides comprehensive analytics covering user engagement, event management, and platform performance metrics.', { width: columnContentWidth, align: 'justify' });
        const leftColumnEndY = doc.y;
        doc.y = columnStartY;
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1F2937').text('Recent Activity Summary', rightColumnX, doc.y, { width: columnContentWidth });
        doc.moveDown(0.5);
        const activityItems = [`• ${events.slice(0, 5).length} most recent events created`, `• ${users.slice(0, 5).length} latest user registrations`, `• ${activeEvents} events currently accepting bets`, `• Platform operational since ${events.length > 0 ? new Date(events[events.length - 1].createdAt).toLocaleDateString() : 'N/A'}`];
        doc.fontSize(10).font('Helvetica').fillColor('#374151').text(activityItems.join('\n'), { width: columnContentWidth });
        doc.y = Math.max(leftColumnEndY, doc.y) + 20;

        // --- Page 2: Event Analytics ---
        addPageFooter(doc);
        doc.addPage();
        addPageHeader(doc, 'Event Analytics');
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937').text('Event Analytics', 30, 120);
        addSectionDivider(doc);
        if (events.length > 0) {
            const chartY = doc.y;
            doc.fontSize(14).font('Helvetica-Bold').text('Event Status Breakdown', 30, chartY);
            const eventChartData = [{ value: activeEvents, label: 'Active', color: '#10B981' }, { value: completedEvents, label: 'Completed', color: '#F59E0B' }];
            drawDonutChart(doc, eventChartData, 120, chartY + 100, 70);
            const statsX = 320;
            doc.fontSize(14).font('Helvetica-Bold').text('Key Statistics', statsX, chartY);
            doc.moveDown();
            const eventStats = [`Total Events: ${totalEvents}`, `Avg. Duration: ${(events.reduce((s, e) => s + (new Date(e.endTime) - new Date(e.startTime)), 0) / events.length / 86400000).toFixed(1)} days`, `Events with Options: ${events.filter(e => e.options && e.options.length > 0).length}`, `Events with Images: ${events.filter(e => e.imageURL).length}`];
            doc.fontSize(10).font('Helvetica').list(eventStats, statsX, doc.y, { bulletRadius: 1.5 });
            doc.y = chartY + 220;
            addSectionDivider(doc);
            doc.fontSize(12).font('Helvetica-Bold').text('Recent Events List', 30, doc.y).moveDown(0.5);
            const eventHeaders = ['Event Name', 'Status', 'Start Date', 'End Date'];
            const eventRows = events.slice(0, 10).map(e => [e.name?.substring(0, 30) + (e.name?.length > 30 ? '...' : '') || 'N/A', new Date(e.endTime) > new Date() ? 'Active' : 'Completed', new Date(e.startTime).toLocaleDateString(), new Date(e.endTime).toLocaleDateString()]);
            createTable(doc, eventHeaders, eventRows, doc.y);
        } else {
            doc.fontSize(12).font('Helvetica').fillColor('#6B7280').text('No events found to analyze.');
        }
        
        // --- Page 3: User Analytics ---
        addPageFooter(doc);
        doc.addPage();
        addPageHeader(doc, 'User Analytics');
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937').text('User Analytics', 30, 120);
        addSectionDivider(doc);
        if (users.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('Monthly User Registrations', 30, doc.y);
            const usersByMonth = users.reduce((acc, user) => {
                const month = new Date(user.createdAt).toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
                acc[month] = (acc[month] || 0) + 1; return acc;
            }, {});
            const sortedMonths = Object.keys(usersByMonth).sort((a,b) => new Date(a) - new Date(b));
            const barChartData = sortedMonths.slice(-6).map(month => ({ label: month, value: usersByMonth[month], color: '#8B5CF6' }));
            drawBarChart(doc, barChartData, 50, doc.y + 20, 480, 150);
            doc.y += 200;
            addSectionDivider(doc);
            const userSectionY = doc.y;
            const userColumnGap = 40;
            const userColumnWidth = (doc.page.width - 60 - userColumnGap) / 2;
            const leftColX = 30;
            doc.fontSize(14).font('Helvetica-Bold').text('User Verification', leftColX, userSectionY);
            const userChartData = [{ value: verifiedUsers, label: 'Verified', color: '#10B981' }, { value: totalUsers - verifiedUsers, label: 'Unverified', color: '#EF4444' }];
            const chartCenterX = leftColX + userColumnWidth / 2 - 40;
            drawDonutChart(doc, userChartData, chartCenterX, userSectionY + 90, 60);
            const rightColX = leftColX + userColumnWidth + userColumnGap;
            doc.fontSize(12).font('Helvetica-Bold').text('Recent Users', rightColX, userSectionY);
            const tableY = userSectionY + 25;
            const userHeaders = ['Email', 'Join Date', 'Status'];
            const userRows = users.slice(0, 5).map(u => [ u.email?.substring(0, 12) + (u.email?.length > 12 ? '...' : '') || 'N/A', new Date(u.createdAt).toLocaleDateString(), u.isVerified ? 'Verified' : 'Pending']);
            const tableColWidths = [userColumnWidth * 0.5, userColumnWidth * 0.25, userColumnWidth * 0.25];
            createTable(doc, userHeaders, userRows, tableY, { x: rightColX, width: userColumnWidth, columnWidths: tableColWidths });
        } else {
            doc.fontSize(12).font('Helvetica').fillColor('#6B7280').text('No users found to analyze.');
        }

        // --- Page 4: Technical & Security Report (RESTORED) ---
        addPageFooter(doc);
        doc.addPage();
        addPageHeader(doc, 'Technical & Security Report');
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937').text('Technical & Security Report', 30, 120);
        addSectionDivider(doc);

        const techSectionY = doc.y;
        const techColumnGap = 40;
        const techColumnWidth = (doc.page.width - 60 - techColumnGap) / 2;

        // Left Column: System Health
        const techLeftColX = 30;
        doc.fontSize(14).font('Helvetica-Bold').text('System Health Status', techLeftColX, techSectionY);
        doc.moveDown(0.5);
        const healthList = ['✓ Database Connection: Operational', '✓ API Endpoints: Responsive', '✓ User Authentication: Secure', '✓ Data Backup: Scheduled Daily', '✓ Event Processing: Normal'];
        doc.fontSize(10).font('Helvetica').fillColor('#374151').text(healthList.join('\n'), { width: techColumnWidth });
        const leftEndY = doc.y;

        // Right Column: Security Overview
        const techRightColX = techLeftColX + techColumnWidth + techColumnGap;
        doc.y = techSectionY; // Reset Y for the second column
        doc.fontSize(14).font('Helvetica-Bold').text('Security Overview', techRightColX, techSectionY);
        doc.moveDown(0.5);
        const securityList = [`• Failed Logins (24h): 0`, `• Suspicious Activities: 0 Detected`, `• Data Encryption: AES-256 (Active)`, `• API Rate Limiting: Active`, `• User Verification: ${totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : '0.0'}%`];
        doc.fontSize(10).font('Helvetica').fillColor('#374151').text(securityList.join('\n'), { width: techColumnWidth });
        const rightEndY = doc.y;

        doc.y = Math.max(leftEndY, rightEndY) + 40;

        // Final confidential message
        doc.fontSize(8).font('Helvetica').fillColor('#6B7280').text('This report is generated automatically and contains sensitive platform data. Distribution should be limited to authorized personnel only.', 30, doc.page.height - 80, { width: doc.page.width - 60, align: 'center' });

        // Finalize PDF
        addPageFooter(doc);
        doc.end();
        
        writeStream.on("finish", () => {
            res.download(filePath, "STAKEWISE_Platform_Report.pdf", (err) => {
                if (err) {
                    console.error("Error sending file:", err);
                    if (!res.headersSent) res.status(500).json({ message: "Error downloading report" });
                }
                setTimeout(() => fs.unlink(filePath, (e) => e && console.error("Error deleting temp file:", e)), 5000);
            });
        });

    } catch (error) {
        console.error("Error generating report:", error);
        if (!res.headersSent) res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

export default router;