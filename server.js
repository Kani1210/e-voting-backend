const express = require("express");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 ALL ROUTES CALLED HERE
app.use("/", userRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 Server running on port 5000");
});