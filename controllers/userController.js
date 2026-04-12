const pool = require("../db/db");

/* ============================================================
   HOW TO KNOW WHICH FIELD TO USE:
   Run this in your browser console:
     const token = localStorage.getItem("token");
     const payload = JSON.parse(atob(token.split(".")[1]));
     console.log(payload);

   If it shows { id: 5 }       → userId = req.user?.id
   If it shows { user_id: 5 }  → userId = req.user?.user_id
   If it shows { userId: 5 }   → userId = req.user?.userId
   
   This file uses req.user?.id  (most common)
   Change all 3 places below if your field name is different.
============================================================ */

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
    // 🔥 FIX: read whichever field your JWT uses
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id;
    const { iris } = req.body;

    // DEBUG — check your Render logs to confirm userId is not undefined
    console.log("addIris → req.user:", req.user, "| userId:", userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized — userId missing from token" });
    }

    if (!iris) {
      return res.status(400).json({ success: false, message: "iris field is required" });
    }

    await pool.query(
      "UPDATE users SET iris_template=$1 WHERE user_id=$2",
      [iris, userId]
    );

    res.json({ success: true, message: "Iris saved ✅" });
  } catch (err) {
    console.error("addIris error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ADD FINGER */
exports.addFinger = async (req, res) => {
  try {
    // 🔥 FIX: read whichever field your JWT uses
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id;
    const { finger } = req.body;

    // DEBUG — check your Render logs to confirm userId is not undefined
    console.log("addFinger → req.user:", req.user, "| userId:", userId);
    console.log("finger received, length:", finger?.length);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized — userId missing from token" });
    }

    if (!finger) {
      return res.status(400).json({ success: false, message: "finger field is required" });
    }

    await pool.query(
      "UPDATE users SET finger_template=$1 WHERE user_id=$2",
      [finger, userId]
    );

    res.json({ success: true, message: "Fingerprint saved ✅" });
  } catch (err) {
    console.error("addFinger error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* VERIFY BIOMETRIC */
exports.verifyBiometric = async (req, res) => {
  try {
    // 🔥 FIX: read whichever field your JWT uses
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id;
    const { iris, finger } = req.body;

    console.log("verifyBiometric → userId:", userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized — userId missing from token" });
    }

    const result = await pool.query(
      "SELECT iris_template, finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.iris_template === iris && user.finger_template === finger) {
      return res.json({ success: true, message: "Verified ✅" });
    }

    res.json({ success: false, message: "Verification failed ❌" });
  } catch (err) {
    console.error("verifyBiometric error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};