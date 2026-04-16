const pool = require("../db/db");

/* ================= ENROLL ================= */
exports.addIris = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { irisImage } = req.body;

    if (!irisImage) {
      return res.status(400).json({ success: false, message: "No image" });
    }

    // 🔥 CALL PYTHON AI
    const response = await fetch("http://127.0.0.1:5001/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ irisImage }),
    });

    const data = await response.json();

    if (!data.iris_vector) {
      return res.status(500).json({ success: false, error: "Python failed" });
    }

    const irisVector = data.iris_vector;

    await pool.query(
      "UPDATE users SET iris_code = $1 WHERE user_id = $2",
      [JSON.stringify(irisVector), userId]
    );

    res.json({ success: true, message: "Iris Enrolled ✅" });

  } catch (err) {
    console.error("ENROLL ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= VERIFY ================= */

function compareVectors(a, b) {
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

    // 🔥 CALL PYTHON AI
    const response = await fetch("http://127.0.0.1:5001/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ irisImage }),
    });

    const data = await response.json();

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

    const verified = distance < 5000; // adjust if needed

    res.json({ verified, distance });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ verified: false });
  }
};