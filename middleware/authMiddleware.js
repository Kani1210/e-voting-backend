const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "SECRET_KEY"); // 🔁 use your key

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};