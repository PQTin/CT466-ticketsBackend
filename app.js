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

// Import router
const authRoutes = require("./app/routes/auth.routes");

// Routes
app.use("/api/auth", authRoutes);

// Export app cho server.js dùng
module.exports = app;
