const express = require("express");
const router = express.Router();
const datVeController = require("../controllers/datVe.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, datVeController.bookTicket);
router.post("/addCombo", verifyToken, datVeController.addComboToTicket);
router.post(
  "/calculate-payment",
  verifyToken,
  datVeController.paymentCalculator
);
router.post(
  "/calculate-combo",
  verifyToken,
  datVeController.calculateComboTotal
);

module.exports = router;
