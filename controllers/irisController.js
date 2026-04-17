const pool = require("../db/db");

const BRIDGE_URL = process.env.BRIDGE_URL || "http://localhost:5001";

/* ================= ENROLL ================= */
exports.addIris = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { irisImage } = req.body;

    if (!irisImage) {
      return res.status(400).json({ success: false, message: "No iris image provided" });
    }

    // Save the base64 BMP image directly into the DB
    await pool.query(
      "UPDATE users SET iris_code = $1 WHERE user_id = $2",
      [irisImage, userId]
    );

    res.json({ success: true, message: "Iris Enrolled ✅" });

  } catch (err) {
    console.error("ENROLL ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= VERIFY ================= */
exports.verifyIris = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { irisImage } = req.body;

    if (!irisImage) {
      return res.status(400).json({ verified: false, message: "No iris image provided" });
    }

    // 1. Fetch stored iris from DB
    const result = await pool.query(
      "SELECT iris_code FROM users WHERE user_id = $1",
      [userId]
    );

    if (!result.rows.length || !result.rows[0].iris_code) {
      return res.json({ verified: false, message: "No iris enrolled for this user" });
    }

    const storedImageBase64 = result.rows[0].iris_code;

    // 2. Send BOTH images to .NET bridge for SDK matching
    const bridgeResponse = await fetch(
      `${BRIDGE_URL}/api/iris/verify-with-image/${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storedImageBase64: storedImageBase64,
          liveImageBase64: irisImage,
        }),
      }
    );

    const bridgeData = await bridgeResponse.json();

    res.json({
      verified: bridgeData.success || false,
      matchScore: bridgeData.matchScore || 0,
      message: bridgeData.message || "Verification complete",
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ verified: false, error: err.message });
  }
};