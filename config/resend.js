const { Resend } = require("resend");

// SAFE CHECK (prevents crash)
if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing in .env / Render env");
}

const resend = new Resend(process.env.RESEND_API_KEY || "");

module.exports = resend;