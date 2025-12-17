const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { OpenAI } = require('openai');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------------------------------------
   MIDDLEWARE
------------------------------------------------- */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

/* -------------------------------------------------
   OPENAI CONFIG
------------------------------------------------- */
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/* -------------------------------------------------
   EMAIL CONFIG
------------------------------------------------- */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* -------------------------------------------------
   REPORT TEMPLATES
------------------------------------------------- */
const reportTemplates = {
    Exploring: {
        focus: "Identifying high-impact AI opportunities and readiness gaps"
    },
    Planning: {
        focus: "Building a structured and executable AI roadmap"
    },
    Implementing: {
        focus: "Optimizing active AI initiatives and scaling impact"
    },
    Scaling: {
        focus: "Enterprise-wide AI transformation and competitive advantage"
    }
};

/* -------------------------------------------------
   MARKET INSIGHTS
------------------------------------------------- */
const marketInsights = {
    Nigeria: "Rapidly growing tech ecosystem with mobile-first opportunities and infrastructure constraints.",
    "United Kingdom": "Highly regulated AI environment with strong compliance and governance requirements.",
    "United States": "Advanced AI market with strong competition and innovation velocity.",
    Multiple: "Cross-market complexity requiring adaptable AI governance and architecture."
};

/* -------------------------------------------------
   AI REPORT GENERATOR (USES 8 ANSWERS)
------------------------------------------------- */
async function generateAIReport(userData) {
    try {
        const template = reportTemplates[userData.businessStage];
        const marketInsight = marketInsights[userData.country];

        const prompt = `
You are Adenola Adegbesan, The AI Maverick.

Create a clear, practical, executive-level AI strategy report based strictly on the information below.
Write in confident, human, advisory language — not generic AI tone.

Client Profile
Name: ${userData.fullName}
Primary Market: ${userData.country}
Business Stage: ${userData.businessStage}
Market Context: ${marketInsight}
Strategic Focus: ${template.focus}

AI Strategy Assessment Responses

1. Business problem or opportunity AI should address:
${userData.q1_problem}

2. Executive ownership of AI initiative:
${userData.q2_owner}

3. Current data availability and governance:
${userData.q3_data}

4. Technology and infrastructure readiness:
${userData.q4_tech}

5. Regulatory, legal, and ethical considerations:
${userData.q5_risk}

6. Existing AI capability within the organization:
${userData.q6_capability}

7. Budget, talent, and change management capacity:
${userData.q7_budget}

8. Success measurement and risk tolerance:
${userData.q8_success}

Required Output Structure (use clear section titles):

Executive Summary  
Current AI Readiness Assessment  
Key Market Opportunities  
Strategic Recommendations (5–7 highly specific actions)  
30–60–90 Day Execution Plan  
Risk & Governance Considerations  
Success Metrics & KPIs  
Clear Next Steps for Leadership
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a senior AI strategy advisor." },
                { role: "user", content: prompt }
            ],
            max_tokens: 3000,
            temperature: 0.65
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error("Report Error:", error);
        return "AI report generation failed.";
    }
}

/* -------------------------------------------------
   LEAD SUBMISSION ENDPOINT
------------------------------------------------- */
app.post('/api/lead-submission', async (req, res) => {
    try {
        const {
            fullName,
            email,
            country,
            businessStage,
            q1_problem,
            q2_owner,
            q3_data,
            q4_tech,
            q5_risk,
            q6_capability,
            q7_budget,
            q8_success
        } = req.body;

        if (
            !fullName || !email || !country || !businessStage ||
            !q1_problem || !q2_owner || !q3_data || !q4_tech ||
            !q5_risk || !q6_capability || !q7_budget || !q8_success
        ) {
            return res.status(400).json({
                success: false,
                message: "All assessment fields are required."
            });
        }

        const userData = {
            fullName,
            email,
            country,
            businessStage,
            q1_problem,
            q2_owner,
            q3_data,
            q4_tech,
            q5_risk,
            q6_capability,
            q7_budget,
            q8_success
        };

        const report = await generateAIReport(userData);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Your Strategic AI Clarity Report`,
            html: `<pre style="white-space: pre-wrap; font-family: Arial;">${report}</pre>`
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Lead Submission Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while generating report."
        });
    }
});

/* -------------------------------------------------
   NEWSLETTER
------------------------------------------------- */
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Send welcome email to subscriber
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Welcome to AI Maverick Insights",
            html: `
                <h2>Welcome to AI Maverick Insights</h2>
                <p>You have successfully subscribed to our newsletter.</p>
                <p>Expect practical AI strategy insights and market updates.</p>
            `
        });

        // Notify site owner
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "New Newsletter Subscriber",
            html: `
                <p>A new user has subscribed to the newsletter:</p>
                <strong>${email}</strong>
            `
        });

        console.log(`New newsletter subscriber: ${email}`);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error("NEWSLETTER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to process newsletter subscription"
        });
    }
});


/* -------------------------------------------------
   HEALTH CHECK
------------------------------------------------- */
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: "OK" });
});

/* -------------------------------------------------
   ROOT
------------------------------------------------- */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/* -------------------------------------------------
   START SERVER
------------------------------------------------- */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
