const pool = require("../db/db");

/* =========================
   GET USERS
========================= */
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   GET USER BY ID
========================= */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT user_id, name, email FROM users WHERE user_id=$1",
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   ADD FINGERPRINT
========================= */
// SAVE FINGERPRINT
exports.addFinger = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let { template } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!template) {
      return res.status(400).json({ success: false, message: "Template required" });
    }

    template = template.replace(/\s/g, "").trim();

    await pool.query(
      "UPDATE users SET finger_template=$1 WHERE user_id=$2",
      [template, userId]
    );

    return res.json({ success: true, message: "Saved ✔" });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET FINGERPRINT (FIXED)
exports.getFingerTemplate = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    if (!result.rows.length || !result.rows[0].finger_template) {
      return res.status(404).json({
        success: false,
        message: "No fingerprint found",
      });
    }

    return res.json({
      success: true,
      template: result.rows[0].finger_template,
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};