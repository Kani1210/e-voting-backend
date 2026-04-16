const pool = require("../db/db");
const resend = require("../config/resend");
const generateOTP = require("../utils/otp");

/* =========================
   SEND OTP
========================= */
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 1. Check user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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

    // 4. Send Email (Resend)
    const emailResponse = await resend.emails.send({
  from: "E-Voting <support@coreberly.in>",
  to: email,
  subject: "🔐 OTP Verification - E-Voting System",
  html: `<b>Your OTP is ${otp}</b>`,
});

    console.log("📧 Email sent:", emailResponse);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("OTP SEND ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =========================
   VERIFY OTP
========================= */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP required",
      });
    }

    // 1. Get user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // 2. Check OTP
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
        message: "Invalid or expired OTP",
      });
    }

    const record = otpResult.rows[0];

    // 3. Mark as used
    await pool.query(
      "UPDATE otp_verifications SET is_used=true WHERE id=$1",
      [record.id]
    );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      user_id: user.id,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};back to old code