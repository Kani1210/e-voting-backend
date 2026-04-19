const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");


/* TEST */
router.get("/test", (req, res) => {
  res.json({ success: true, message: "User route working ✔" });
});


/* =========================
   USERS ROUTES
========================= */

// GET ALL USERS (ADMIN)
router.get("/", auth, userController.getUsers);

// CREATE USER (ADMIN)
router.post("/", auth, userController.addUser);

// 🔥 IMPORTANT: PUT /me BEFORE /:id
// GET MY PROFILE (USER + ADMIN)
router.get("/me", auth, userController.getMyProfile);

// GET USER BY ID (ADMIN)
router.get("/:id", auth, userController.getUser);

// UPDATE USER (ADMIN)
router.put("/:id", auth, userController.updateUser);

// DELETE USER (ADMIN)
router.delete("/:id", auth, userController.deleteUser);

module.exports = router;