const express = require("express");
const router = express.Router();
const promoController = require("../controllers/kMGiamGia.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, isAdmin, promoController.createPromotion);
router.put(
  "/status/:id",
  verifyToken,
  isAdmin,
  promoController.updatePromotionStatus
);
router.get("/", promoController.getAllPromotions);

router.post(
  "/issue/all",
  verifyToken,
  isAdmin,
  promoController.issueCodesToAllUsers
);
router.post(
  "/issue/group",
  verifyToken,
  isAdmin,
  promoController.issueCodesToUserGroup
);
router.get("/my-codes", verifyToken, promoController.getUserDiscountCodes);

module.exports = router;
