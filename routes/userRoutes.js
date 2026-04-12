const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

/* =========================
   TEST ROUTE
========================= */
router.get("/test", (req, res) => {
  return res.json({ success: true, message: "User route working ✔" });
});

/* =========================
   USER ROUTES
========================= */
router.get("/users", auth, userController.getUsers);
router.get("/user/:id", auth, userController.getUser);

/* =========================
   BIOMETRIC ROUTES
========================= */
router.post("/add-iris", auth, userController.addIris);
router.post("/add-finger", auth, userController.addFinger);
router.post("/verify", auth, userController.verifyBiometric);

module.exports = router;