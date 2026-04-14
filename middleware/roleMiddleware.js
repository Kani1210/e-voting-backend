const role = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user; // from authMiddleware

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied: insufficient role",
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  };
};

module.exports = role;