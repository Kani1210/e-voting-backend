const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

// TEST
router.get("/test", (req, res) => {
  res.json({ success: true, message: "User route working ✔" });
});

// USERS
router.get("/users", auth, userController.getUsers);
router.get("/user/:id", auth, userController.getUser);

/* UPDATE */
router.put("/user/:id", auth, userController.updateUser);

/* DELETE */
router.delete("/user/:id", auth, userController.deleteUser);

// FINGERPRINT
router.post("/add-finger", auth, userController.addFinger);
router.get("/get-finger", auth, userController.getFingerTemplate);

module.exports = router;