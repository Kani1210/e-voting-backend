const pool = require("../db/db");
const bcrypt = require("bcrypt");
const resend = require("../config/resend");

/**
 * CAST VOTE CONTROLLER
 */
exports.castVote = async (req, res) => {
  const userId = req.user.id;

  try {
    // Check user vote status
    const userResult = await pool.query(
      "SELECT has_voted FROM users WHERE id = $1",
      [userId]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.has_voted) {
      return res.status(403).json({
        success: false,
        message: "You have already voted!",
        alreadyVoted: true,
      });
    }

    // Mark voted and lock account
    await pool.query(
      `UPDATE users 
       SET has_voted = TRUE, voted_at = NOW(), is_locked = TRUE 
       WHERE id = $1`,
      [userId]
    );

    return res.json({
      success: true,
      message: "Vote cast successfully!",
    });
  } catch (error) {
    console.error("Cast Vote Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};