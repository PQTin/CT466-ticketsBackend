const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ve.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/my-tickets", verifyToken, ticketController.getTicketsByUser);
router.get("/", verifyToken, isAdmin, ticketController.getAllTicketsAdmin);
router.get("/qr/:qr", verifyToken, isAdmin, ticketController.getTicketByQR);
router.put(
  "/check-in/:qr",
  verifyToken,
  isAdmin,
  ticketController.checkInTicket
);
router.put(
  "/confirm/:qr",
  verifyToken,
  isAdmin,
  ticketController.confirmPaymentAtCounter
);

router.put("/cancel/:veId", verifyToken, ticketController.cancelTicket);

router.get(
  "/combo-by-id/:veId",
  verifyToken,
  isAdmin,
  ticketController.getCombosByTicketId
);
module.exports = router;
