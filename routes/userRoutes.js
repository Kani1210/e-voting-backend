const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/users", userController.getUsers);
router.get("/user/:id", userController.getUser);

router.post("/add-iris", userController.addIris);
router.post("/add-finger", userController.addFinger);

module.exports = router;