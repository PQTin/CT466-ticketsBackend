const express = require("express");
const router = express.Router();
const userController = require("../controllers/nguoiDung.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/me", verifyToken, userController.getCurrentUser);
router.get("/", verifyToken, isAdmin, userController.getAllUsers);

router.post("/rate-combo", verifyToken, userController.rateCombo);

router.get("/notifications", verifyToken, userController.getUserNotifications);
router.get(
  "/notification/unread-count",
  verifyToken,
  userController.getUnreadNotificationCount
);
router.put(
  "/notification/mark-read",
  verifyToken,
  userController.markNotificationsAsRead
);
router.post(
  "/sendNotification",
  verifyToken,
  isAdmin,
  userController.sendNotification
);
module.exports = router;
