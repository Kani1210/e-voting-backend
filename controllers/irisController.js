const pool = require("../db/db");

const PYTHON_URL           = process.env.PYTHON_URL || "http://localhost:5002/extract";
const DISTANCE_THRESHOLD   = 0.45;
const SIMILARITY_THRESHOLD = 0.85;

async function callPython(irisImageBase64) {
  const res = await fetch(PYTHON_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ irisImage: irisImageBase64 }),
  });
  if (!res.ok) throw new Error(`Python service returned HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.iris_vector) throw new Error("Python did not return iris_vector");
  return data.iris_vector;
}

function euclidean(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  return (na === 0 || nb === 0) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ── ENROLL ────────────────────────────────────────────────────────────────────
exports.addIris = async (req, res) => {
  try {
    const userId = req.user?.id; // ✅ numeric: 6, 7, 8...
    const { irisImageBase64 } = req.body;

    console.log("[ENROLL] userId:", userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!irisImageBase64 || irisImageBase64.trim().length === 0) {
      return res.status(400).json({ success: false, message: "No iris image provided" });
    }

    let vector;
    try {
      vector = await callPython(irisImageBase64.trim());
    } catch (pyErr) {
      console.error("[ENROLL] Python error:", pyErr.message);
      return res.status(503).json({
        success: false,
        message: "Python AI service unreachable — make sure it is running on port 5002",
      });
    }

    console.log("[ENROLL] vector dims:", vector.length);

    const result = await pool.query(
      `UPDATE users SET iris_code=$1 WHERE id=$2 RETURNING id, LENGTH(iris_code) AS stored_len`,
      [JSON.stringify(vector), userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "Iris enrolled successfully", dims: vector.length });

  } catch (err) {
    console.error("[ENROLL ERROR]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── VERIFY ────────────────────────────────────────────────────────────────────
exports.verifyIris = async (req, res) => {
  try {
    const userId = req.user?.id; // ✅ numeric: 6, 7, 8...
    const { irisImageBase64 } = req.body;

    console.log("[VERIFY] userId:", userId);

    if (!userId) {
      return res.status(401).json({ verified: false, message: "Unauthorized" });
    }

    if (!irisImageBase64 || irisImageBase64.trim().length === 0) {
      return res.status(400).json({ verified: false, message: "No iris image provided" });
    }

    const row = await pool.query(
      `SELECT iris_code FROM users WHERE id=$1`,
      [userId]
    );

    if (!row.rows.length) {
      return res.json({ verified: false, message: "User not found" });
    }

    const { iris_code } = row.rows[0];

    if (!iris_code || iris_code.trim().length === 0) {
      return res.json({ verified: false, message: "No iris enrolled. Please enroll first." });
    }

    let storedVec;
    try {
      storedVec = JSON.parse(iris_code);
    } catch {
      return res.json({ verified: false, message: "Stored iris data is corrupt. Please re-enroll." });
    }

    let liveVec;
    try {
      liveVec = await callPython(irisImageBase64.trim());
    } catch (pyErr) {
      console.error("[VERIFY] Python error:", pyErr.message);
      return res.status(503).json({
        verified: false,
        message: "Python AI service unreachable — make sure it is running on port 5002",
      });
    }

    if (liveVec.length !== storedVec.length) {
      return res.json({ verified: false, message: "Iris template outdated. Please re-enroll." });
    }

    const distance   = euclidean(liveVec, storedVec);
    const similarity = cosine(liveVec, storedVec);
    const distPass   = distance   < DISTANCE_THRESHOLD;
    const simPass    = similarity > SIMILARITY_THRESHOLD;
    const verified   = distPass && simPass;

    console.log(`[VERIFY] dist=${distance?.toFixed(4)} sim=${similarity?.toFixed(4)} verified=${verified}`);

    return res.json({
      verified,
      distance:            parseFloat(distance.toFixed(4)),
      similarity:          parseFloat(similarity.toFixed(4)),
      distanceThreshold:   DISTANCE_THRESHOLD,
      similarityThreshold: SIMILARITY_THRESHOLD,
      message: verified ? "Iris matched — identity verified" : "Iris does not match",
    });

  } catch (err) {
    console.error("[VERIFY ERROR]", err);
    return res.status(500).json({ verified: false, error: err.message });
  }
};