const pool = require("../db/db");

/* GET USER */
exports.getUser = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT * FROM users WHERE user_id=$1",
    [id]
  );

  res.json(result.rows[0]);
};

/* ADD IRIS */
exports.addIris = async (req, res) => {
  const { userId, iris } = req.body;

  const result = await pool.query(
    `UPDATE users SET iris_template=$1 WHERE user_id=$2 RETURNING *`,
    [iris, userId]
  );

  res.json(result.rows[0]);
};

/* ADD FINGERPRINT */
exports.addFinger = async (req, res) => {
  const { userId, finger } = req.body;

  const result = await pool.query(
    `UPDATE users SET finger_template=$1 WHERE user_id=$2 RETURNING *`,
    [finger, userId]
  );

  res.json(result.rows[0]);
};

/* GET ALL USERS */
exports.getUsers = async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
};