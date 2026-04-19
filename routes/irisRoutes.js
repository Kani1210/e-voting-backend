const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const irisController = require("../controllers/irisController");

router.post("/add",    auth, irisController.addIris);
router.post("/verify", auth, irisController.verifyIris);

module.exports = router;