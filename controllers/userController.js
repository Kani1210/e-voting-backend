const pool = require("../db/db");

/* GET USERS */
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET USER */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT user_id, name, email FROM users WHERE user_id=$1",
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ADD IRIS */
exports.addIris = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { iris } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await pool.query(
      "UPDATE users SET iris_template=$1 WHERE user_id=$2",
      [iris, userId]
    );

    res.json({ success: true, message: "Iris saved ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ADD FINGER */
exports.addFinger = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { finger } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await pool.query(
      "UPDATE users SET finger_template=$1 WHERE user_id=$2",
      [finger, userId]
    );

    res.json({ success: true, message: "Fingerprint saved ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* VERIFY */
exports.verifyBiometric = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { iris, finger } = req.body;

    const result = await pool.query(
      "SELECT iris_template, finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.iris_template === iris && user.finger_template === finger) {
      return res.json({ success: true, message: "Verified ✅" });
    }

    res.json({ success: false, message: "Verification failed ❌" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};