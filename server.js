const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

/* =========================
   CORS
========================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

/* =========================
   BODY PARSER
========================= */
app.use(express.json({ limit: "50mb" }));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  return res.json({ success: true, message: "API Running ✔" });
});

/* =========================
   ROUTES MOUNTING (VERY IMPORTANT)
========================= */
app.use("/auth", authRoutes);
app.use("/users", userRoutes); // 🔥 THIS MUST MATCH FRONTEND

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});