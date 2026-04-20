const express = require("express");
const router = express.Router();

const voteController = require("../controllers/voteController");
const auth = require("../middleware/authMiddleware");

// CAST VOTE
router.post("/cast", auth, voteController.castVote);

module.exports = router;