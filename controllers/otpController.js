const pool = require("../db/db");
const transporter = require("../config/mail");
const generateOTP = require("../utils/otp");

/* =========================
   SEND OTP
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

        // 3. Save OTP (NO timezone issue - JS handles time)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        await pool.query(
            `INSERT INTO otp_verifications (user_id, otp, expires_at)
       VALUES ($1, $2, $3)`,
            [user.id, otp, expiresAt]
        );

        // 4. Send Email
        await transporter.sendMail({
            to: email,
            subject: "🔐 OTP Verification - E-Voting System",

            html: `
  <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">

    <div style="
      max-width:420px;
      margin:auto;
      background:white;
      padding:20px;
      border-radius:12px;
      box-shadow:0 3px 12px rgba(0,0,0,0.15);
    ">

      <h2 style="text-align:center; color:#2c3e50; font-size:22px;">
        🗳️ E-Voting System
      </h2>

      <p style="font-size:15px; color:#333; text-align:center;">
        Your OTP verification code
      </p>

      <div style="text-align:center; margin:25px 0;">
        <span style="
          font-size:30px;
          letter-spacing:6px;
          font-weight:bold;
          color:white;
          background:#4CAF50;
          padding:14px 30px;
          border-radius:10px;
          display:inline-block;
        ">
          ${otp}
        </span>
      </div>

      <p style="font-size:14px; color:#555; text-align:center;">
        This OTP is valid for <b>5 minutes</b>
      </p>

      <p style="font-size:12px; color:#888; text-align:center; margin-top:20px;">
        ⚠️ Do not share this OTP with anyone
      </p>

      <hr style="margin:20px 0;" />

      <p style="font-size:11px; color:#999; text-align:center;">
        Works on mobile & desktop browsers
      </p>

    </div>

  </div>
  `
        });

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
   VERIFY OTP
========================= */
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. Get user
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

        // 2. Get latest valid OTP (IMPORTANT FIX)
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

        // 3. Mark OTP as used
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