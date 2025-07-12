const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, isAdmin, dashboardController.getDashboardStats);

module.exports = router;
