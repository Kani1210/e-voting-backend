const pool = require("../db/db");
const bcrypt = require("bcrypt");
const resend = require("../config/resend");



// ================= GET ALL USERS (PUBLIC / LOGGED USER) =================
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, voter_id, name, email,
      gender, dob, age, phone, address, aadhar_no,
      status, role, created_at
      FROM users
      ORDER BY id ASC
    `);

    res.json({ success: true, users: result.rows });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ================= ADD USER =================
exports.addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      gender,
      dob,
      age,
      phone,
      address,
      aadhar_no,
      role,
    } = req.body;

    const userId = "USR" + Date.now();
    const voterId = "VOTER" + Date.now();

    // ✅ still required for DB (but not shared)
    const password = "default123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
      (user_id, voter_id, name, email, password, gender,
       dob, age, phone, address, aadhar_no, status, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [
        userId,
        voterId,
        name,
        email,
        hashedPassword,
        gender,
        dob,
        age,
        phone,
        address,
        aadhar_no,
        "active",
        role || "voter",
      ]
    );

    const user = result.rows[0];

    console.log("User created:", email);

    /* =========================
       SEND CLEAN EMAIL
    ========================= */
    const emailResponse = await resend.emails.send({
      from: "E-Voting <support@coreberly.in>",
      to: email,
      subject: "Voter Registration Successful",
      html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:40px;">
        
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#4f46e5,#3b82f6); color:#fff; padding:20px; text-align:center;">
            <h2 style="margin:0;">🗳️ E-Voting System</h2>
            <p style="margin:5px 0 0;">Secure Digital Voting</p>
          </div>

          <!-- Body -->
          <div style="padding:30px;">
            <h3 style="margin-top:0;">Welcome, ${name} 👋</h3>
            <p>Your voter registration has been successfully completed.</p>

            <div style="background:#f9fafb; padding:20px; border-radius:8px; margin:20px 0;">
              <p><b>👤 Name:</b> ${name}</p>
              <p><b>📧 Email:</b> ${email}</p>
              <p><b>🆔 Voter ID:</b> <span style="color:#3b82f6;">${voterId}</span></p>
            </div>

            <p style="margin-top:20px;">
              You can now securely log in using OTP verification.
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

    console.log("Email sent:", emailResponse);

    res.json({
      success: true,
      message: "User created & email sent",
      user,
    });

  } catch (err) {
    console.error("Add User Error:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// ================= GET USER BY ID =================
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM users WHERE id=$1`,
      [id]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ================= UPDATE USER =================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, status, role } = req.body;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        status = COALESCE($5, status),
        role = COALESCE($6, role)
       WHERE id=$7
       RETURNING *`,
      [name, email, phone, address, status, role, id]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ================= DELETE USER =================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=$1", [id]);

    res.json({ success: true, message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ================= MY PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid token data" });
    }

    const result = await pool.query(
      `SELECT id, user_id, voter_id, name, email, phone, gender, dob, age, address, aadhar_no, role, status
       FROM users WHERE id=$1`,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ================= UPDATE ONLY VOTING FLAGS =================
exports.unlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET
         has_voted = FALSE,
         voted_at  = '2026-04-20 14:58:16.623195',
         is_locked = FALSE
       WHERE id = $1
       RETURNING id, name, has_voted, voted_at, is_locked`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Voting flags updated successfully",
      user: result.rows[0],
    });

  } catch (err) {
    console.error("Update Voting Flags Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
``
