const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware"); // 🔥 important

router.get("/users", auth, userController.getUsers);
router.get("/user/:id", auth, userController.getUser);

router.post("/add-iris", auth, userController.addIris);
router.post("/add-finger", auth, userController.addFinger);

router.post("/verify", auth, userController.verifyBiometric); // 🔥 new

module.exports = router;