const pool = require("../db/db");

/* =========================
   GET ALL USERS
========================= */
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        user_id,
        voter_id,
        name,
        email,
        gender,
        age,
        phone,
        status,
        role,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      users: result.rows
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   GET USER BY ID
========================= */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        user_id,
        voter_id,
        name,
        email,
        gender,
        age,
        phone,
        status,
        role,
        created_at,
        updated_at
      FROM users
      WHERE user_id=$1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};


/* =========================
   ADD USER (FINAL FIXED)
========================= */
exports.addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      gender,
      age,
      phone,
      address,
      aadhar_no,
      votes,
      status,
      role
    } = req.body;

    // REQUIRED FIELDS
    if (!name || !email || !password || votes === undefined) {
      return res.status(400).json({
        success: false,
        message: "name, email, password, votes required"
      });
    }

    // AUTO IDS
    const user_id = "USR" + Date.now();
    const voter_id = "VOTER" + Date.now() + Math.floor(Math.random() * 999);

    const result = await pool.query(
      `INSERT INTO users (
        user_id,
        voter_id,
        name,
        email,
        password,
        gender,
        age,
        phone,
        address,
        aadhar_no,
        votes,
        status,
        role,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
      RETURNING *`,
      [
        user_id,
        voter_id,
        name,
        email,
        password,
        gender || null,
        age || null,
        phone || null,
        address || null,
        aadhar_no || null,
        votes,
        status || "active",
        role || "voter"
      ]
    );

    return res.json({
      success: true,
      message: "User created successfully",
      user: result.rows[0]
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

/* =========================
   UPDATE USER
========================= */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      gender,
      age,
      phone,
      status,
      role
    } = req.body;

    const result = await pool.query(`
      UPDATE users
      SET 
        name=$1,
        email=$2,
        gender=$3,
        age=$4,
        phone=$5,
        status=$6,
        role=$7,
        updated_at=NOW()
      WHERE user_id=$8
      RETURNING *
    `, [name, email, gender, age, phone, status, role, id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User updated",
      user: result.rows[0]
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
/* =========================
   DELETE USER
========================= */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE user_id=$1 RETURNING user_id",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User deleted"
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   ADD FINGERPRINT
========================= */
// SAVE FINGERPRINT
exports.addFinger = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let { template } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!template) {
      return res.status(400).json({ success: false, message: "Template required" });
    }

    template = template.replace(/\s/g, "").trim();

    await pool.query(
      "UPDATE users SET finger_template=$1 WHERE user_id=$2",
      [template, userId]
    );

    return res.json({ success: true, message: "Saved ✔" });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// GET FINGERPRINT (FIXED)
exports.getFingerTemplate = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT finger_template FROM users WHERE user_id=$1",
      [userId]
    );

    if (!result.rows.length || !result.rows[0].finger_template) {
      return res.status(404).json({
        success: false,
        message: "No fingerprint found",
      });
    }

    return res.json({
      success: true,
      template: result.rows[0].finger_template,
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// SAVE 3 IRIS TEMPLATES
/* =========================
   SAVE IRIS (3 TEMPLATES)
========================= */
exports.addIris = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { irisTemplate1, irisTemplate2, irisTemplate3 } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!irisTemplate1 || !irisTemplate2 || !irisTemplate3) {
      return res.status(400).json({ success: false, message: "All 3 templates required" });
    }

    const t1 = irisTemplate1.replace(/\s/g, "").trim();
    const t2 = irisTemplate2.replace(/\s/g, "").trim();
    const t3 = irisTemplate3.replace(/\s/g, "").trim();

    await pool.query(
      `UPDATE users 
       SET iris_template_1=$1,
           iris_template_2=$2,
           iris_template_3=$3
       WHERE user_id=$4`,
      [t1, t2, t3, userId]
    );

    return res.json({
      success: true,
      message: "Iris templates saved ✔"
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/* =========================
   GET IRIS (FOR VERIFY)
========================= */
exports.getIrisTemplates = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT iris_template_1, iris_template_2, iris_template_3
       FROM users
       WHERE user_id=$1`,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const row = result.rows[0];

    const templates = [
      row.iris_template_1,
      row.iris_template_2,
      row.iris_template_3
    ].filter(Boolean);

    return res.json({
      success: true,
      templates
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};