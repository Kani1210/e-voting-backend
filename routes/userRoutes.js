const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

/* =========================
   TEST ROUTE
========================= */
router.get("/test", (req, res) => {
  res.json({ success: true, message: "User route working ✔" });
});


/* =========================
   USERS ROUTES
========================= */

// GET ALL USERS
router.get("/", auth, userController.getUsers);

// CREATE USER
router.post("/", auth, userController.addUser);

// GET MY PROFILE (USER + ADMIN)
router.get("/me", auth, userController.getMyProfile);

// GET USER BY ID
router.get("/:id", auth, userController.getUser);

// UPDATE USER
router.put("/:id", auth, userController.updateUser);

// DELETE USER
router.delete("/:id", auth, userController.deleteUser);

module.exports = router;