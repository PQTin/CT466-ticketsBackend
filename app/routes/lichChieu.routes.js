const express = require("express");
const router = express.Router();
const showtimeController = require("../controllers/lichChieu.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");
const { uploadCombo } = require("../middlewares/upload");
router.post("/", verifyToken, isAdmin, showtimeController.createShowtime);
router.get(
  "/admin",
  verifyToken,
  isAdmin,
  showtimeController.getAllShowtimesAdmin
);
router.get("/client", showtimeController.getAllShowtimesClient);
router.get("/byId/:id", showtimeController.getShowtimeById);
router.put("/:id", verifyToken, isAdmin, showtimeController.updateShowtime);
router.delete("/:id", verifyToken, isAdmin, showtimeController.deleteShowtime);

router.get(
  "/seats/by-Showtime/:lichChieuId",
  showtimeController.getSeatByShowtime
);

router.post(
  "/combo",
  uploadCombo,
  verifyToken,
  isAdmin,
  showtimeController.createCombo
);
router.get("/combo", showtimeController.getAllCombo);
router.delete(
  "/combo/:id",
  verifyToken,
  isAdmin,
  showtimeController.deleteCombo
);

router.get(
  "/movie/all",
  verifyToken,
  isAdmin,
  showtimeController.getNameMovies
);
router.get(
  "/branch/all",
  verifyToken,
  isAdmin,
  showtimeController.getNameBranch
);

module.exports = router;
