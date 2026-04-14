const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* =========================
   REGISTER USER (UPDATED)
========================= */
const register = async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;

    // validation
    if (!name || !email || !password || !gender) {
      return res.status(400).json({
        success: false,
        message: "name, email, password and gender required",
      });
    }

    // check user exists
    const check = await pool.query(
      "SELECT * FROM users WHERE email = $1",
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
      "VOTER" + Date.now() + Math.floor(100 + Math.random() * 900);

    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const result = await pool.query(
      `
      INSERT INTO users 
        (user_id, voter_id, name, email, password, gender, status, role)
      VALUES 
        ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING user_id, voter_id, name, email, gender;
      `,
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

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      user: result.rows[0],
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/* =========================
   LOGIN USER
========================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
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
        gender: user.gender,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  register,
  login,
};