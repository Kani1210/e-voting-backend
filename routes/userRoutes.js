const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// 👤 user creation
router.post("/create-user", userController.createUser);

// 👁 iris
router.post("/add-iris", userController.addIris);

// 👆 fingerprint
router.post("/add-finger", userController.addFinger);

// 📋 all users
router.get("/users", userController.getUsers);

// 🔍 single user
router.get("/user/:id", userController.getUser);

module.exports = router;