const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* =========================
   REGISTER
========================= */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password required",
      });
    }

    // check user exists
    const check = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // generate IDs
    const userId = "USR" + Date.now();

    const voterId =
      "VOTER" +
      Date.now() +
      Math.floor(100 + Math.random() * 900);

    console.log("Generated voterId:", voterId);

    const hashedPassword = await bcrypt.hash(password, 10);

    // FIXED INSERT (MATCH ALL IMPORTANT FIELDS)
    const result = await pool.query(
      `INSERT INTO users 
        (user_id, voter_id, name, email, password, status, role)
       VALUES 
        ($1,$2,$3,$4,$5,$6,$7)
       RETURNING user_id, voter_id, name, email`,
      [
        userId,
        voterId,
        name,
        email,
        hashedPassword,
        "active",
        "voter"
      ]
    );

    return res.json({
      success: true,
      message: "Registered successfully",
      user: result.rows[0],
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =========================
   LOGIN
========================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        voter_id: user.voter_id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  register,
  login,
};