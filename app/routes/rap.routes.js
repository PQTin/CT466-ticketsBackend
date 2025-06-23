const express = require("express");
const router = express.Router();
const rapController = require("../controllers/rap.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/branch", verifyToken, isAdmin, rapController.createBranch);
router.get("/branch/getAll", rapController.getAllBranch);
router.delete(
  "/branch/:id",
  verifyToken,
  isAdmin,
  rapController.softDeleteBranch
);

router.post("/room", verifyToken, isAdmin, rapController.createRoom);
router.get("/room/by-branch/:chiNhanhId", rapController.getRoomsByBranch);
router.delete("/room/:id", verifyToken, isAdmin, rapController.softDeleteRoom);

router.post("/seatType", verifyToken, isAdmin, rapController.createSeatType);
router.get("/seatType/getAll", rapController.getAllSeatType);
router.put("/seatType/:id", verifyToken, isAdmin, rapController.updateType);
router.delete(
  "/seatType/:id",
  verifyToken,
  isAdmin,
  rapController.softDeleteseatType
);

router.get("/seat/by-room/:phongChieuId", rapController.getSeatsByRoom);
router.put("/seat/:gheId", verifyToken, isAdmin, rapController.updateSeatType);

module.exports = router;
