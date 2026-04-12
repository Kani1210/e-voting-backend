const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

/* ✅ IMPORTANT */
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.json({ message: "API Running ✔" });
});

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);   // 🔥 THIS IS YOUR MAIN ROUTE

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});