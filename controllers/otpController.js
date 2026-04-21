const pool = require("../db/db");
const resend = require("../config/resend");
const generateOTP = require("../utils/otp");
const jwt = require("jsonwebtoken");

/* =========================
   SEND OTP
========================= */
/* =========================
   SEND OTP (WITH LOCK CHECK)
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

    // ✅ Get required user fields only
    const userResult = await pool.query(
      "SELECT id, email, is_locked, has_voted FROM users WHERE email=$1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    // 🔒 BLOCK OTP IF USER IS LOCKED
    if (user.is_locked) {
      return res.status(403).json({
        success: false,
        message: "Your account is locked. You have already voted.",
        isLocked: true,
      });
    }

    // ✅ Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_verifications (user_id, otp, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, otp, expiresAt]
    );

    // ✅ Send OTP email
    await resend.emails.send({
      from: "E-Voting <support@coreberly.in>",
      to: email,
      subject: "OTP Verification - E-Voting",
      html: `
  <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:40px;">
    
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4f46e5,#3b82f6); color:#fff; padding:20px; text-align:center;">
        <h2 style="margin:0;">🗳️ E-Voting System</h2>
        <p style="margin:5px 0 0;">Secure Login Verification</p>
      </div>

      <!-- Body -->
      <div style="padding:30px; text-align:center;">
        <h3 style="margin-top:0;">OTP Verification 🔐</h3>
        <p>Use the following One-Time Password to continue:</p>

        <!-- OTP BOX -->
        <div style="font-size:32px; font-weight:bold; letter-spacing:6px; background:#f1f5f9; padding:15px 25px; display:inline-block; border-radius:8px; margin:20px 0; color:#1e293b;">
          ${otp}
        </div>

        <p style="color:#64748b;">This OTP is valid for <b>5 minutes</b>.</p>

        <p style="margin-top:20px;">
          ⚠️ Do not share this OTP with anyone for security reasons.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f1f5f9; padding:15px; text-align:center; font-size:12px; color:#64748b;">
        <p style="margin:0;">© 2026 E-Voting System</p>
        <p style="margin:0;">Secure • Transparent • Reliable</p>
      </div>

    </div>
  </div>
  `,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
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
      return res.status(400).json({ success: false, message: "Email and OTP required" });
    }

    const userResult = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];

    const otpResult = await pool.query(
      `SELECT * FROM otp_verifications
       WHERE user_id=$1 AND otp=$2 AND is_used=false AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [user.id, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    await pool.query("UPDATE otp_verifications SET is_used=true WHERE id=$1", [otpResult.rows[0].id]);

    // ✅ Only sign numeric id — same id used in finger + iris controllers
    const token = jwt.sign(
      {
        id: user.id,    // numeric: 6, 7, 8... → req.user.id in ALL controllers
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user.id,       // numeric id for route /user/6
        user_id: user.user_id,  // USR... for display only
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { sendOtp, verifyOtp };