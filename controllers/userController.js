const pool = require("../db/db");

/* -------------------------
   CREATE USER
--------------------------*/
exports.createUser = async (req, res) => {
  const { name, email } = req.body;

  try {
    const userId = "USR" + Date.now();
    const password = "PWD" + Math.floor(1000 + Math.random() * 9000);

    const result = await pool.query(
      `INSERT INTO users (user_id, name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, email, password]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------
   ADD IRIS
--------------------------*/
exports.addIris = async (req, res) => {
  const { userId, irisTemplate } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET iris_template = $1
       WHERE user_id = $2
       RETURNING *`,
      [irisTemplate, userId]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------
   ADD FINGERPRINT
--------------------------*/
exports.addFinger = async (req, res) => {
  const { userId, fingerTemplate } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET finger_template = $1
       WHERE user_id = $2
       RETURNING *`,
      [fingerTemplate, userId]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------
   GET ALL USERS
--------------------------*/
exports.getUsers = async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
};

/* -------------------------
   GET SINGLE USER
--------------------------*/
exports.getUser = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT * FROM users WHERE user_id = $1",
    [id]
  );

  res.json(result.rows[0]);
};