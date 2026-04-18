const pool = require("../db/db");
const bcrypt = require("bcrypt");
const resend = require("../config/resend");

/* =========================
   GET ALL USERS (ADMIN)
========================= */
exports.getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const result = await pool.query(`
      SELECT id, user_id, voter_id, name, email,
      gender, dob, age, phone, address, aadhar_no,
      status, role, created_at
      FROM users
      ORDER BY id ASC
    `);

    return res.json({ success: true, users: result.rows });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* =========================
   ADD USER + SEND EMAIL
========================= */
exports.addUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

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

    if (!name || !email || !gender) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const check = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ message: "Email exists" });
    }

    const userId = "USR" + Date.now();
    const voterId = "VOTER" + Date.now() + Math.floor(Math.random() * 1000);

    const password = "default123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
      (user_id, voter_id, name, email, password, gender,
       dob, age, phone, address, aadhar_no, status, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id, user_id, voter_id, name, email, role`,
      [
        userId,
        voterId,
        name,
        email,
        hashedPassword,
        gender,
        dob || null,
        age || null,
        phone || null,
        address || null,
        aadhar_no || null,
        "active",
        role || "voter",
      ]
    );

    const user = result.rows[0];

    /* 🔥 SEND EMAIL */
    await resend.emails.send({
      from: "E-Voting <support@coreberly.in>",
      to: email,
      subject: "Your Voter Account Created",
      html: `
        <h3>Welcome ${name}</h3>
        <p>Your account is created successfully.</p>
        <p><b>Voter ID:</b> ${voterId}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Password:</b> ${password}</p>
      `,
    });

    return res.json({
      success: true,
      message: "User created & email sent",
      user,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


/* =========================
   GET SINGLE USER
========================= */
exports.getUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, user_id, voter_id, name, email,
        gender, dob, age, phone, address, aadhar_no,
        status, role, created_at
       FROM users
       WHERE id=$1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* =========================
   UPDATE USER (FULL)
========================= */
exports.updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

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
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        gender = COALESCE($3, gender),
        dob = COALESCE($4, dob),
        age = COALESCE($5, age),
        phone = COALESCE($6, phone),
        address = COALESCE($7, address),
        aadhar_no = COALESCE($8, aadhar_no),
        role = COALESCE($9, role),
        status = COALESCE($10, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id=$11
      RETURNING id, name, email, role`,
      [
        name,
        email,
        gender,
        dob,
        age,
        phone,
        address,
        aadhar_no,
        role,
        status,
        id,
      ]
    );

    return res.json({
      success: true,
      message: "User updated",
      user: result.rows[0],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* =========================
   DELETE USER
========================= */
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=$1", [id]);

    return res.json({
      success: true,
      message: "User deleted",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};