const express = require("express");
const router = express.Router();
const rapController = require("../controllers/rap.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/branch/create", verifyToken, isAdmin, rapController.createBranch);
router.get("/branch/getAll", rapController.getAllBranch);
router.delete(
  "/branch/soft-delete/:id",
  verifyToken,
  isAdmin,
  rapController.softDeleteBranch
);

router.post("/room/create", verifyToken, isAdmin, rapController.createRoom);
router.get("/room/by-branch/:chiNhanhId", rapController.getRoomsByBranch);
router.delete(
  "/room/soft-delete/:id",
  verifyToken,
  isAdmin,
  rapController.softDeleteRoom
);

router.post(
  "/seatType/create",
  verifyToken,
  isAdmin,
  rapController.createSeatType
);
router.get("/seatType/getAll", rapController.getAllSeatType);
router.put(
  "/seatType/update/:id",
  verifyToken,
  isAdmin,
  rapController.updateType
);
router.delete(
  "/seatType/soft-delete/:id",
  verifyToken,
  isAdmin,
  rapController.softDeleteseatType
);

router.get("/seat/by-room/:phongChieuId", rapController.getSeatsByRoom);
router.put(
  "/seat/update/:gheId",
  verifyToken,
  isAdmin,
  rapController.updateSeatType
);

module.exports = router;
