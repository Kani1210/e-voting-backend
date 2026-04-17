const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const fingerprintController = require("../controllers/fingerprintController");

// MUST be functions
router.post("/add", auth, fingerprintController.addFinger);
router.get("/get", auth, fingerprintController.getFingerTemplate);

module.exports = router;