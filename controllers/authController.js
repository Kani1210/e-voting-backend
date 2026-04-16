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

    const user_id = "USR" + Date.now();
    const voter_id = "VOTER" + Date.now();

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users 
        (user_id, voter_id, name, email, password, gender, status, role)
       VALUES 
        ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, user_id, voter_id, name, email, gender, role`,
      [
        user_id,
        voter_id,
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
   LOGIN (FULL FIXED)
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
      {
        id: user.id,
        userId: user.user_id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,

      user: {
        id: user.id,                 // ✅ numeric DB id
        user_id: user.user_id,       // ✅ your custom id
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