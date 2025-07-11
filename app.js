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
app.use("/api/showtime", require("./app/routes/lichChieu.routes"));
app.use("/api/promotion", require("./app/routes/kMGiamGia.routes"));
app.use("/api/user", require("./app/routes/nguoiDung.routes"));
app.use("/api/bookTicket", require("./app/routes/daVe.routes"));
app.use("/api/ticket", require("./app/routes/ve.routes"));
app.use("/api/dashboard", require("./app/routes/dashboard.routes"));
// Export app cho server.js dùng
module.exports = app;
