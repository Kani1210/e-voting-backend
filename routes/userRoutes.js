const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth"); // if using JWT

// USERS
router.get("/users", userController.getUsers);

// GET USER
router.get("/users/:id", userController.getUser);

// ADD FINGERPRINT
router.post("/users/add-finger", auth, userController.addFinger);

// ✅ THIS IS WHAT YOU ARE MISSING
router.get(
  "/users/get-finger",
  auth,
  userController.getFingerTemplate
);

module.exports = router;