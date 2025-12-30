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

/**
 * -------------------------------------------------
 * ENV CONFIG
 * -------------------------------------------------
 */
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 10000; // Updated for Render's default port

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
 * EMAIL TRANSPORTER (The "Service" Method)
 * This is the most reliable way to bypass cloud timeouts
 * -------------------------------------------------
 */
/* -------------------------------------------------
   EMAIL TRANSPORTER (UPDATED)
------------------------------------------------- */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,  // CHANGE: Switch from 587 to 465
    secure: true, // CHANGE: Must be true for port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false 
    },
    // ADDITION: Increase connection timeout
    connectionTimeout: 10000, 
    greetingTimeout: 10000 
});
/**
 * -------------------------------------------------
 * LEAD SUBMISSION ENDPOINT (Email PDF + Score)
 * -------------------------------------------------
 */
app.post('/api/lead-submission', limiter, async (req, res) => {
    try {
        const { email, fullName, readinessScore } = req.body;

        if (!email || !fullName) {
            return res.status(400).json({ success: false, message: "Missing required info" });
        }

        // CORRECT PATH: Assumes PDF is in public/resources/
        const pdfPath = path.join(__dirname, 'public', 'resources', 'Strategic-AI-Clarity-Report.pdf');

        // 1. Send Email to the User
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
                    filename: 'Strategic-AI-Clarity-Report.pdf',
                    path: pdfPath 
                }
            ]
        });

        // 2. Notify Admin
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `🔥 New Lead: ${fullName} (${readinessScore}%)`,
            html: `<p>New assessment completed by <strong>${fullName}</strong> (${email}). Score: <strong>${readinessScore}%</strong>.</p>`
        });

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("SUBMISSION ERROR:", error);
        res.status(500).json({ success: false, message: "Server error during processing." });
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});