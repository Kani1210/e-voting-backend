/**
 * irisController.js
 * =================
 *
 * IMPORTANT CHANGE FROM PREVIOUS VERSION
 * ───────────────────────────────────────
 * eye_side is NO LONGER detected by Python Hough circle position.
 * It is passed EXPLICITLY from the frontend (user selects left/right before scanning).
 *
 * This is reliable because the Mantra 100v2 always centres the iris —
 * so position-based detection always returns "unknown" and the check is skipped.
 *
 * Flow:
 *   ENROLL  → frontend sends { irisImage, eye_side: "left"|"right" }
 *             → Python mirror-flips right-eye image, extracts vector
 *             → we store vector + eye_side in DB
 *
 *   VERIFY  → frontend sends { irisImage, eye_side: "left"|"right" }
 *             → if eye_side != enrolled eye_side  → instant reject
 *             → else  → Python extracts vector, we compare
 */

const pool = require("../db/db");

const PYTHON_URL           = process.env.PYTHON_URL || "http://localhost:5002/extract";
const DISTANCE_THRESHOLD   = 0.45;   // same eye same person ≈ 0.05–0.35
const SIMILARITY_THRESHOLD = 0.85;   // same eye same person ≈ 0.90–0.99


// ─────────────────────────────────────────────────────────────────────────────
//  HELPER — call Python /extract
// ─────────────────────────────────────────────────────────────────────────────
async function callPython(irisImage, eye_side) {
  const res = await fetch(PYTHON_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ irisImage, eye_side }),
  });

  if (!res.ok) throw new Error(`Python service returned HTTP ${res.status}`);

  const data = await res.json();
  if (!data?.iris_vector) throw new Error("Python did not return iris_vector");

  return data.iris_vector;   // number[]
}


// ─────────────────────────────────────────────────────────────────────────────
//  HELPER — euclidean distance
// ─────────────────────────────────────────────────────────────────────────────
function euclidean(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}


// ─────────────────────────────────────────────────────────────────────────────
//  HELPER — cosine similarity
// ─────────────────────────────────────────────────────────────────────────────
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return null;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  return (na === 0 || nb === 0) ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}


// ─────────────────────────────────────────────────────────────────────────────
//  ENROLL
//  Body: { irisImage: "<base64>", eye_side: "left" | "right" }
// ─────────────────────────────────────────────────────────────────────────────
exports.addIris = async (req, res) => {
  try {
    const userId          = req.user.userId;
    const { irisImage, eye_side } = req.body;

    if (!irisImage) {
      return res.status(400).json({ success: false, message: "No iris image provided" });
    }

    const side = (eye_side === "right") ? "right" : "left";   // default left

    console.log(`[ENROLL] user=${userId}  eye=${side}`);

    const vector = await callPython(irisImage, side);

    console.log(`[ENROLL] vector dims=${vector.length}`);

    await pool.query(
      `UPDATE users
          SET iris_code     = $1,
              iris_eye_side = $2
        WHERE user_id = $3`,
      [JSON.stringify(vector), side, userId]
    );

    return res.json({
      success:  true,
      message:  `Iris enrolled — ${side} eye`,
      eye_side: side,
    });

  } catch (err) {
    console.error("[ENROLL ERROR]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
//  VERIFY
//  Body: { irisImage: "<base64>", eye_side: "left" | "right" }
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyIris = async (req, res) => {
  try {
    const userId          = req.user.userId;
    const { irisImage, eye_side } = req.body;

    if (!irisImage) {
      return res.status(400).json({ verified: false, message: "No iris image provided" });
    }

    const liveEye = (eye_side === "right") ? "right" : "left";

    console.log(`[VERIFY] user=${userId}  live_eye=${liveEye}`);

    // ── 1. Fetch enrolled data ────────────────────────────────────────────
    const result = await pool.query(
      `SELECT iris_code, iris_eye_side FROM users WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows.length || !result.rows[0].iris_code) {
      return res.json({
        verified: false,
        message:  "No iris enrolled. Please enroll first.",
      });
    }

    const storedVec = JSON.parse(result.rows[0].iris_code);
    const storedEye = result.rows[0].iris_eye_side || "unknown";

    console.log(`[VERIFY] stored_eye=${storedEye}`);

    // ── 2. EYE SIDE CHECK — instant reject if wrong eye ──────────────────
    // storedEye="unknown" means enrolled with old code → skip check (safe fallback)
    if (storedEye !== "unknown" && storedEye !== liveEye) {
      console.log(`[VERIFY] EYE MISMATCH enrolled=${storedEye} live=${liveEye}`);
      return res.json({
        verified:      false,
        enrolled_eye:  storedEye,
        presented_eye: liveEye,
        message: `Wrong eye. You enrolled your ${storedEye} eye. ` +
                 `Please scan your ${storedEye} eye to verify.`,
      });
    }

    // ── 3. Extract live vector (Python mirror-flips right eye) ────────────
    const liveVec = await callPython(irisImage, liveEye);

    console.log(`[VERIFY] live dims=${liveVec.length}  stored dims=${storedVec.length}`);

    // ── 4. Dimension mismatch → stale template ────────────────────────────
    if (liveVec.length !== storedVec.length) {
      return res.json({
        verified: false,
        message:  "Iris template is outdated. Please re-enroll your iris.",
      });
    }

    // ── 5. Compute distance + similarity ─────────────────────────────────
    const distance   = euclidean(liveVec, storedVec);
    const similarity = cosine(liveVec, storedVec);

    const distPass = distance   <  DISTANCE_THRESHOLD;
    const simPass  = similarity >  SIMILARITY_THRESHOLD;
    const verified = distPass && simPass;

    console.log(
      `[VERIFY] dist=${distance?.toFixed(4)} (<${DISTANCE_THRESHOLD}? ${distPass})  ` +
      `sim=${similarity?.toFixed(4)} (>${SIMILARITY_THRESHOLD}? ${simPass})  ` +
      `verified=${verified}`
    );

    return res.json({
      verified,
      distance:            parseFloat(distance.toFixed(4)),
      similarity:          parseFloat(similarity.toFixed(4)),
      distanceThreshold:   DISTANCE_THRESHOLD,
      similarityThreshold: SIMILARITY_THRESHOLD,
      enrolled_eye:        storedEye,
      presented_eye:       liveEye,
      message: verified
        ? "Iris matched — identity verified"
        : failReason(distPass, simPass),
    });

  } catch (err) {
    console.error("[VERIFY ERROR]", err.message);
    return res.status(500).json({ verified: false, error: err.message });
  }
};


function failReason(distPass, simPass) {
  if (!distPass && !simPass) return "Iris does not match — distance and similarity both failed.";
  if (!distPass)             return "Iris does not match — vector distance too large.";
  if (!simPass)              return "Iris does not match — texture pattern mismatch.";
  return "Iris does not match.";
}