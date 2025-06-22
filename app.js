const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load biến môi trường từ .env
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// file tĩnh
app.use("/uploads", express.static(path.join(__dirname, "app/uploads")));

// Routes
app.use("/api/auth", require("./app/routes/auth.routes"));
app.use("/api/movie", require("./app/routes/phim.routes"));
app.use("/api/rap", require("./app/routes/rap.routes"));
// Export app cho server.js dùng
module.exports = app;
