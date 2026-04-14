require("dns").setDefaultResultOrder("ipv4first");
const express = require("express");

const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const otpRoutes = require("./routes/otpRoutes");

const app = express();

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

/* =========================
   BODY PARSER
========================= */
app.use(express.json({ limit: "50mb" }));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({ success: true, message: "API Running ✔" });
});

/* =========================
   ROUTES
========================= */
// IMPORTANT: THESE DEFINE YOUR URL PREFIX
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/otp", otpRoutes);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});