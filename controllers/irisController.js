const pool = require("../db/db");

/* ================= ENROLL ================= */
exports.addIris = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { irisImage } = req.body;

    if (!irisImage) {
      return res.status(400).json({ success: false, message: "No image" });
    }

    const response = await fetch("https://iris-ai-vyiz.onrender.com/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ irisImage }),
    });

    const data = await response.json();

    if (!data || !data.iris_vector) {
      console.log("❌ Python error:", data);
      return res.status(500).json({ success: false, error: "Python failed" });
    }

    await pool.query(
      "UPDATE users SET iris_code = $1 WHERE user_id = $2",
      [JSON.stringify(data.iris_vector), userId]
    );

    res.json({ success: true, message: "Iris Enrolled ✅" });

  } catch (err) {
    console.error("ENROLL ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= VERIFY ================= */

function compareVectors(a, b) {
  if (!a || !b || a.length !== b.length) return null;

  let diff = 0;

  for (let i = 0; i < a.length; i++) {
    diff += Math.abs(a[i] - b[i]);
  }

  return diff;
}

exports.verifyIris = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { irisImage } = req.body;

    if (!irisImage) {
      return res.json({ verified: false });
    }

    const response = await fetch("https://iris-ai-vyiz.onrender.com/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ irisImage }),
    });

    const data = await response.json();

    if (!data || !data.iris_vector) {
      console.log("❌ Python error:", data);
      return res.json({ verified: false, distance: null });
    }

    const liveVector = data.iris_vector;

    const result = await pool.query(
      "SELECT iris_code FROM users WHERE user_id = $1",
      [userId]
    );

    if (!result.rows.length || !result.rows[0].iris_code) {
      return res.json({ verified: false, message: "No iris enrolled" });
    }

    const storedVector = JSON.parse(result.rows[0].iris_code);

    const distance = compareVectors(liveVector, storedVector);

    if (distance === null) {
      return res.json({ verified: false, distance: null });
    }

    // 🔥 FINAL THRESHOLD (TUNE HERE)
    const verified = distance < 200;

    res.json({ verified, distance });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ verified: false });
  }
};