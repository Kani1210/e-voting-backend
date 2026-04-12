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
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ADD IRIS */
exports.addIris = async (req, res) => {
  try {
    // JWT is signed with { userId: user.user_id } in authController
    const userId = req.user?.userId;
    const { iris } = req.body;

    console.log("addIris → userId:", userId, "| iris length:", iris?.length);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized — not logged in" });
    }
    if (!iris) {
      return res.status(400).json({ success: false, message: "iris field is required in request body" });
    }

    const result = await pool.query(
      "UPDATE users SET iris_template=$1 WHERE user_id=$2 RETURNING user_id",
      [iris, userId]
    );

    // Check if any row was actually updated
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found in database" });
    }

    res.json({ success: true, message: "Iris saved ✅" });
  } catch (err) {
    console.error("addIris error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ADD FINGER */
exports.addFinger = async (req, res) => {
  try {
    // JWT is signed with { userId: user.user_id } in authController
    const userId = req.user?.userId;
    const { finger } = req.body;

    console.log("addFinger → userId:", userId, "| finger length:", finger?.length);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized — not logged in" });
    }
    if (!finger) {
      return res.status(400).json({ success: false, message: "finger field is required in request body" });
    }

    const result = await pool.query(
      "UPDATE users SET finger_template=$1 WHERE user_id=$2 RETURNING user_id",
      [finger, userId]
    );

    // Check if any row was actually updated
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found in database" });
    }

    res.json({ success: true, message: "Fingerprint saved ✅" });
  } catch (err) {
    console.error("addFinger error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* VERIFY BIOMETRIC */
exports.verifyBiometric = async (req, res) => {
  try {
    // JWT is signed with { userId: user.user_id } in authController
    const userId = req.user?.userId;
    const { iris, finger } = req.body;

    console.log("verifyBiometric → userId:", userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized — not logged in" });
    }

    const result = await pool.query(
      "SELECT iris_template, finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const irisMatch   = iris   ? user.iris_template   === iris   : true;
    const fingerMatch = finger ? user.finger_template === finger : true;

    if (irisMatch && fingerMatch) {
      return res.json({ success: true, message: "Verified ✅" });
    }

    res.json({ success: false, message: "Biometric verification failed ❌" });
  } catch (err) {
    console.error("verifyBiometric error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};