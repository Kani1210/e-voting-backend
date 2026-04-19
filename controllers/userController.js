const pool = require("../db/db");
const bcrypt = require("bcrypt");
const resend = require("../config/resend");


// ================= ADMIN ONLY - GET ALL USERS =================
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

    res.json({ success: true, users: result.rows });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ================= ADMIN ONLY - ADD USER =================
exports.addUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { name, email, gender, dob, age, phone, address, aadhar_no, role } = req.body;

    const userId = "USR" + Date.now();
    const voterId = "VOTER" + Date.now();

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
        role || "voter"
      ]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ================= ADMIN ONLY - GET USER BY ID =================
exports.getUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

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



// ================= ADMIN ONLY - UPDATE USER =================
exports.updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

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



// ================= ADMIN ONLY - DELETE USER =================
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

    await pool.query("DELETE FROM users WHERE id=$1", [id]);

    res.json({ success: true, message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ================= BOTH USER + ADMIN - MY PROFILE =================
exports.getMyProfile = async (req, res) => {
  try {
    const id = req.user.id;

    const result = await pool.query(
      `SELECT id, user_id, voter_id, name, email, phone, gender, address, role, status
       FROM users WHERE id=$1`,
      [id]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};