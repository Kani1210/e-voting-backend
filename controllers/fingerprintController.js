const pool = require("../db/db");

exports.addFinger = async (req, res) => {
  try {
    const userId = req.user.id;
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
    console.log("TOKEN USER:", req.user);

    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    console.log("DB RESULT:", result.rows);

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
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};