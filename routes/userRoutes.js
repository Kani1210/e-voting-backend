const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

// TEST
router.get("/test", (req, res) => {
  res.json({ success: true, message: "User route working ✔" });
});

// USERS

router.get("/", auth, userController.getUsers);
router.get("/:id", auth, userController.getUser);
router.post("/", auth, userController.addUser);
router.put("/:id", auth, userController.updateUser);
router.delete("/:id", auth, userController.deleteUser);

// BIOMETRIC
router.post("/add-finger", auth, userController.addFinger);
router.get("/get-finger", auth, userController.getFingerTemplate);

// IRIS
router.post("/iris/add", auth, userController.addIris);
router.get("/iris/verify", auth, userController.getIrisTemplates);


module.exports = router;