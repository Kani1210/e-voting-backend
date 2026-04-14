const pool = require("../db/db");
const transporter = require("../config/mail");
const generateOTP = require("../utils/otp");

/* =========================
   SEND OTP (FIXED - NON BLOCKING)
========================= */
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Check user
        const userResult = await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userResult.rows[0];

        // 2. Generate OTP
        const otp = generateOTP();

        // 3. Save OTP (5 min expiry)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await pool.query(
            `INSERT INTO otp_verifications (user_id, otp, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, otp, expiresAt]
        );

        // 4. SEND EMAIL (NON-BLOCKING FIX 🚀)
        transporter.sendMail({
            to: email,
            subject: "🔐 OTP Verification - E-Voting System",
            html: `
            <div style="font-family: Arial; padding:20px">
              <h2>🗳️ E-Voting OTP</h2>
              <p>Your OTP is:</p>
              <h1 style="color:green">${otp}</h1>
              <p>Valid for 5 minutes</p>
            </div>
            `
        }, (err, info) => {
            if (err) {
                console.log("❌ Email error:", err.message);
            } else {
                console.log("📧 Email sent:", info.response);
            }
        });

        // 5. RESPOND IMMEDIATELY 🚀
        return res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

/* =========================
   VERIFY OTP (NO CHANGE)
========================= */
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const userResult = await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userResult.rows[0];

        const otpResult = await pool.query(
            `SELECT * FROM otp_verifications
             WHERE user_id=$1 
             AND otp=$2 
             AND is_used=false
             AND expires_at > NOW()
             ORDER BY id DESC
             LIMIT 1`,
            [user.id, otp]
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        const record = otpResult.rows[0];

        await pool.query(
            "UPDATE otp_verifications SET is_used=true WHERE id=$1",
            [record.id]
        );

        return res.json({
            success: true,
            message: "OTP verified successfully",
            user_id: user.id
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    sendOtp,
    verifyOtp
};