const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* =========================
   REGISTER
========================= */
const register = async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    if (!name || !email || !password || !gender) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // check existing user
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

    const userId = "USR" + Date.now();
    const voterId = "VOTER" + Date.now() + Math.floor(Math.random() * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users 
        (user_id, voter_id, name, email, password, gender, status, role)
       VALUES 
        ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, user_id, voter_id, name, email, gender, role`,
      [
        userId,
        voterId,
        name,
        email,
        hashedPassword,
        gender,
        "active",
        "voter",
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
    const { email, password, voterId } = req.body;

    let user;

    // 🔐 ADMIN LOGIN
    if (password) {
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

      user = result.rows[0];

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(400).json({
          success: false,
          message: "Invalid password",
        });
      }
    }

    // 🗳️ VOTER LOGIN
    else if (voterId && email) {
      const result = await pool.query(
        "SELECT * FROM users WHERE voter_id=$1 AND email=$2",
        [voterId, email]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid voter credentials",
        });
      }

      user = result.rows[0];
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid login data",
      });
    }

    // 🔐 JWT TOKEN
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ FIX: ALWAYS INCLUDE DB PRIMARY ID
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,              // 🔥 IMPORTANT FIX (THIS FIXES YOUR /undefined ISSUE)
        user_id: user.user_id,
        voter_id: user.voter_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = { register, login };