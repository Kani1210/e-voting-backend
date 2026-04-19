const pool = require("../db/db");

exports.addFinger = async (req, res) => {
  try {
    const userId = req.user?.id; // ✅ numeric: 6, 7, 8...
    const { template } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cleanTemplate = template.replace(/\s/g, "").trim();

    await pool.query(
      "UPDATE users SET finger_template=$1 WHERE id=$2",
      [cleanTemplate, userId]
    );

    return res.json({ success: true, message: "Saved ✔" });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFingerTemplate = async (req, res) => {
  try {
    const userId = req.user?.id; // ✅ numeric: 6, 7, 8...

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT finger_template FROM users WHERE id=$1",
      [userId]
    );

    if (!result.rows.length || !result.rows[0].finger_template) {
      return res.status(404).json({
        success: false,
        message: "No fingerprint found for this user",
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