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

    // GET USER
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

    // IMPORTANT CHECK
    if (!user.user_id) {
      return res.status(500).json({
        success: false,
        message: "user_id missing in users table",
      });
    }

    // GENERATE OTP
    const otp = generateOTP();

    // 10 MIN EXPIRY
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // DELETE OLD OTPs (optional but recommended)
    await pool.query(
      "DELETE FROM otp_verifications WHERE user_id=$1",
      [user.user_id]
    );

    // INSERT OTP
    await pool.query(
      `INSERT INTO otp_verifications (user_id, otp, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, otp, expiresAt]
    );

    // SEND EMAIL
    await resend.emails.send({
      from: "E-Voting <support@coreberly.in>",
      to: email,
      subject: "OTP Verification",
      html: `<h2>Your OTP is ${otp}</h2>`,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);

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

    // GET USER
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

    // CHECK OTP
    const otpResult = await pool.query(
      `SELECT * FROM otp_verifications
       WHERE user_id=$1
       AND otp=$2
       AND is_used=false
       AND expires_at > NOW()
       ORDER BY id DESC
       LIMIT 1`,
      [user.user_id, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const record = otpResult.rows[0];

    // MARK USED
    await pool.query(
      "UPDATE otp_verifications SET is_used=true WHERE id=$1",
      [record.id]
    );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      user_id: user.user_id,
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};