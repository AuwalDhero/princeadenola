/**
 * =================================================
 * PRODUCTION-READY EXPRESS SERVER
 * Optimized for AI Readiness Assessment & Render
 * =================================================
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const rateLimit = require('express-rate-limit');
// NEW: Required for editing the PDF
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

/**
 * -------------------------------------------------
 * ENV CONFIG
 * -------------------------------------------------
 */
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 10000; // Use Render's default or 10000

/**
 * -------------------------------------------------
 * MIDDLEWARE & SECURITY
 * -------------------------------------------------
 */
// Tell Express to trust Render's proxy for the rate limiter to work
app.set('trust proxy', 1); 

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Protect against spam: Max 5 submissions per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: { success: false, message: "Too many requests. Please try again later." }
});

/**
 * -------------------------------------------------
 * EMAIL TRANSPORTER (Optimized for Render + Gmail)
 * -------------------------------------------------
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your 16-character App Password
    },
    // Essential for cloud stability
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * -------------------------------------------------
 * LEAD SUBMISSION ENDPOINT
 * -------------------------------------------------
 */
app.post('/api/lead-submission', limiter, async (req, res) => {
    try {
        const { email, fullName, readinessScore } = req.body;

        if (!email || !fullName) {
            return res.status(400).json({ success: false, message: "Missing required info" });
        }

        // 1. Locate the Template PDF (Vercel Compatible)
        const templatePath = path.join(process.cwd(), 'public', 'resources', 'Strategic-AI-Clarity-Report.pdf');

        // 2. Load the PDF into memory to edit it
        const existingPdfBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        
        // 3. Embed font and write the Name
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0]; // Edits the first page (Cover)

        // 1. Draw the Client's Name in WHITE
        firstPage.drawText(fullName, {
            x: 254,             // Positioned right after "Prepared for:"
            y: 222,             // Lowered to sit exactly on the first line
            size: 13,           
            font: helveticaFont,
            color: rgb(1, 1, 1), // White
        });

        // 2. Prepare and Draw the Date in WHITE
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        firstPage.drawText(currentDate, {
            x: 225,              // Positioned right after "Date:"
            y: 201,             // Lowered to sit exactly on the second line
            size: 13,
            font: helveticaFont,
            color: rgb(1, 1, 1), // White
        });
        // 4. Save the modified PDF to a Buffer (RAM)
        const pdfBytes = await pdfDoc.save();

        // 5. Send Report to the User
        await transporter.sendMail({
            from: `"Adenola Adegbesan" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your AI Readiness Score: ${readinessScore}%`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Hi ${fullName},</h2>
                    <p>Thank you for completing the <strong>Strategic AI Readiness Assessment</strong>.</p>
                    <p>Your current readiness score is: <span style="font-size: 24px; color: #C9A44A; font-weight: bold;">${readinessScore}%</span></p>
                    <p>I have attached your <strong>Strategic AI Clarity Report</strong>. This document outlines the roadmap needed to navigate your AI transformation.</p>
                    <br>
                    <p>Best regards,<br><strong>Adenola Adegbesan</strong><br>The AI Maverick</p>
                </div>
            `,
            attachments: [
                {
                    // Filename now includes the client's name
                    filename: `Strategic-AI-Clarity-Report-${fullName.replace(/\s+/g, '-')}.pdf`,
                    content: Buffer.from(pdfBytes) // Sends the edited file from memory
                }
            ]
        });

        // 6. Internal Admin Notification
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `🔥 New Lead: ${fullName} (${readinessScore}%)`,
            html: `<p>New assessment completed by <strong>${fullName}</strong> (${email}). Score: <strong>${readinessScore}%</strong>.</p>`
        });

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("SUBMISSION ERROR:", error);
        res.status(500).json({ success: false, message: "Connection error. Please try again." });
    }
});

/**
 * -------------------------------------------------
 * NEWSLETTER ENDPOINT
 * -------------------------------------------------
 */
app.post('/api/newsletter', limiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false });

        await transporter.sendMail({
            from: `"AI Maverick" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to AI Maverick Insights",
            html: `<p>You've successfully subscribed to AI strategy insights.</p>`
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("NEWSLETTER ERROR:", error);
        res.status(500).json({ success: false });
    }
});

/**
 * -------------------------------------------------
 * HEALTH CHECK
 * -------------------------------------------------
 */
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: "OK", timestamp: new Date() });
});

// OLD CODE:
// app.listen(PORT, () => {
//    console.log(`Server running on port ${PORT}`);
// });

// NEW CODE:
// Only listen if running locally (for testing), otherwise export for Vercel
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;