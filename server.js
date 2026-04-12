const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

/* =========================
   CORS CONFIG (SAFE FOR FRONTEND)
========================= */
app.use(cors({
  origin: "*", // in production you can lock to your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

/* =========================
   🔥 BODY LIMIT FIX (IMPORTANT)
========================= */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* (OPTIONAL BUT SAFE) */
app.use(express.text({ limit: "50mb" }));

/* =========================
   HEALTH CHECK ROUTE
========================= */
app.get("/", (req, res) => {
  res.json({ message: "API Running ✔" });
});

/* =========================
   ROUTES
========================= */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});