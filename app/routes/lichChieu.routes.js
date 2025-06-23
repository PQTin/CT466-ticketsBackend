const express = require("express");
const router = express.Router();
const showtimeController = require("../controllers/lichChieu.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, isAdmin, showtimeController.createShowtime);
router.get(
  "/admin",
  verifyToken,
  isAdmin,
  showtimeController.getAllShowtimesAdmin
);
router.get("/client", showtimeController.getAllShowtimesClient);
router.get("/:id", showtimeController.getShowtimeById);
router.put("/:id", verifyToken, isAdmin, showtimeController.updateShowtime);
router.delete("/:id", verifyToken, isAdmin, showtimeController.deleteShowtime);

router.get(
  "/seats/by-Showtime/:lichChieuId",
  showtimeController.getSeatByShowtime
);

router.post("/combo", verifyToken, isAdmin, showtimeController.createCombo);
router.get("/combo", showtimeController.getAllCombo);
router.put("/combo/:id", verifyToken, isAdmin, showtimeController.updateCombo);
router.delete(
  "/combo/:id",
  verifyToken,
  isAdmin,
  showtimeController.deleteCombo
);

module.exports = router;
