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
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =========================
   LOGIN (ADMIN + USER)
========================= */
const login = async (req, res) => {
  try {
    const { email, password, voterId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let user;

    /* =========================
       ADMIN LOGIN (email + password)
    ========================= */
   if (password && password.trim() !== "" && !voterId) {
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

  if (!user.password) {
    return res.status(400).json({
      success: false,
      message: "Password missing in DB",
    });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({
      success: false,
      message: "Invalid password",
    });
  }
}

    /* =========================
       USER LOGIN (voterId + email ONLY)
    ========================= */
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

    /* =========================
       INVALID REQUEST
    ========================= */
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid login data",
      });
    }

    /* =========================
       JWT CHECK
    ========================= */
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET missing in environment variables",
      });
    }

    /* =========================
       GENERATE TOKEN
    ========================= */
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.user_id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* =========================
       RESPONSE
    ========================= */
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        voter_id: user.voter_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = { register, login };