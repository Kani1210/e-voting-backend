/**
 * authMiddleware.js
 * ─────────────────────────────────────────────────
 * Verifies Bearer token and sets req.user = decoded
 *
 * After this middleware:
 *   req.user.id      = numeric PK  (user.id)
 *   req.user.userId  = "USR..."    (user.user_id)
 *   req.user.role    = "voter" | "admin"
 *   req.user.email   = email string
 */

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    // ✅ Debug log — remove after confirming iris works
    console.log("[AUTH] req.user:", {
      id:     decoded.id,
      userId: decoded.userId,
      role:   decoded.role,
      email:  decoded.email,
    });

    next();
  } catch (err) {
    console.error("[AUTH ERROR]", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};