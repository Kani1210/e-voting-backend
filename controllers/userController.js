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
   ADD IRIS
========================= */
exports.addIris = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { iris } = req.body;

    console.log("🔥 addIris HIT");
    console.log("USER:", userId);
    console.log("IRIS LENGTH:", iris?.length);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!iris) {
      return res.status(400).json({
        success: false,
        message: "iris is required",
      });
    }

    const result = await pool.query(
      "UPDATE users SET iris_template=$1 WHERE user_id=$2 RETURNING user_id",
      [iris, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Iris saved ✅",
    });
  } catch (err) {
    console.error("addIris error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =========================
   ADD FINGER (FIXED)
========================= */
exports.addFinger = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { template } = req.body; // ✅ FIXED (was finger before)

    console.log("🔥 addFinger HIT");
    console.log("USER:", userId);
    console.log("TEMPLATE LENGTH:", template?.length);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        message: "template is required",
      });
    }

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
   VERIFY BIOMETRIC
========================= */
exports.verifyBiometric = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { iris, finger } = req.body;

    console.log("🔥 verifyBiometric HIT");
    console.log("USER:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      "SELECT iris_template, finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const irisMatch = iris ? user.iris_template === iris : true;
    const fingerMatch = finger ? user.finger_template === finger : true;

    if (irisMatch && fingerMatch) {
      return res.json({
        success: true,
        message: "Verified ✅",
      });
    }

    return res.json({
      success: false,
      message: "Biometric mismatch ❌",
    });
  } catch (err) {
    console.error("verifyBiometric error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};