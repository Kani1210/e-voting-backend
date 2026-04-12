const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware"); // 🔥 MUST EXIST

/* TEST ROUTE (NO AUTH) */
router.get("/test", (req, res) => {
  res.json({ ok: true });
});

/* USER APIs */
router.get("/users", auth, userController.getUsers);
router.get("/user/:id", auth, userController.getUser);

/* BIOMETRIC */
router.post("/add-iris", auth, userController.addIris);
router.post("/add-finger", auth, userController.addFinger);

router.post("/verify", auth, userController.verifyBiometric);

module.exports = router;