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
exports.addFinger = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let { template } = req.body;

    console.log("🔥 addFinger HIT");
    console.log("USER:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        message: "Template is required",
      });
    }

    // ✅ CLEAN BASE64 (IMPORTANT)
    template = template.trim().replace(/\s/g, "");

    console.log("TEMPLATE LENGTH:", template.length);

    const result = await pool.query(
      "UPDATE users SET finger_template=$1 WHERE user_id=$2 RETURNING user_id",
      [template, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Fingerprint saved ✅",
    });
  } catch (err) {
    console.error("addFinger error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =========================
   GET STORED TEMPLATE (FOR VERIFY)
========================= */
exports.getFingerTemplate = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      "SELECT finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    const user = result.rows[0];

    if (!user || !user.finger_template) {
      return res.status(404).json({
        success: false,
        message: "No fingerprint found",
      });
    }

    return res.json({
      success: true,
      template: user.finger_template, // 👈 SEND TO FRONTEND
    });
  } catch (err) {
    console.error("getFingerTemplate error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};