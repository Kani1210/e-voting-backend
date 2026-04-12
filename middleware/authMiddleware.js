const pool = require("../db/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* REGISTER */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email and password are required" });
    }

    const check = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const userId = "USR" + Date.now();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (user_id, name, email, password)
       VALUES ($1,$2,$3,$4)
       RETURNING user_id, name, email`,
      [userId, name, email, hashedPassword]
    );

    res.json({
      success: true,
      message: "Registered successfully ✅",
      user: result.rows[0],
    });

  } catch (err) {
    console.error("register error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* LOGIN */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Sign JWT with userId — userController reads req.user.userId
    const token = jwt.sign(
      {
        userId: user.user_id,   // ← this is what req.user.userId reads
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }       // extended to 7 days so token doesn't expire during testing
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("login error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};