const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");
const { uploadAvatar } = require("../middlewares/upload");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.put("/update", verifyToken, uploadAvatar, authController.updateUser);

router.post("/register-admin", verifyToken, isAdmin, authController.register);
router.put(
  "/update-admin/:id",
  verifyToken,
  isAdmin,
  uploadAvatar,
  authController.updateUser
);
module.exports = router;
