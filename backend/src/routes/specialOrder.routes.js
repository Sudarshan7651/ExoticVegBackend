const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const specialOrderController = require("../controllers/specialOrder.controller");
const { auth, isTrader } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

// Validation rules
const specialOrderValidation = [
  body("vegetableName")
    .trim()
    .notEmpty()
    .withMessage("Vegetable name is required"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity must be a number")
    .custom((val) => val >= 1)
    .withMessage("Quantity must be at least 1"),
  body("requiredBy")
    .notEmpty()
    .withMessage("Required by date is required")
    .isISO8601()
    .withMessage("Invalid date format"),
  body("unit")
    .optional()
    .isIn(["kg", "g", "pieces", "bunches", "boxes"])
    .withMessage("Invalid unit"),
];

const quoteValidation = [
  body("quotedPrice")
    .notEmpty()
    .withMessage("Quoted price is required")
    .isNumeric()
    .withMessage("Price must be a number"),
  body("pricePerUnit")
    .notEmpty()
    .withMessage("Price per unit is required")
    .isNumeric()
    .withMessage("Price must be a number"),
  body("estimatedDelivery")
    .notEmpty()
    .withMessage("Estimated delivery date is required")
    .isISO8601()
    .withMessage("Invalid date format"),
];

// Routes
router.get("/", auth, specialOrderController.getAllSpecialOrders);
router.get("/my-orders", auth, specialOrderController.getTraderAcceptedOrders);
router.get("/:id", auth, specialOrderController.getSpecialOrderById);
router.post(
  "/",
  auth,
  specialOrderValidation,
  validate,
  specialOrderController.createSpecialOrder,
);
router.post(
  "/:id/quote",
  auth,
  isTrader,
  quoteValidation,
  validate,
  specialOrderController.submitQuote,
);
router.put("/:id/accept/:quoteId", auth, specialOrderController.acceptQuote);
router.put("/:id/reject/:quoteId", auth, specialOrderController.rejectQuote);
router.put("/:id/trader-payment", auth, specialOrderController.markPaymentReceived);
router.put("/:id/buyer-payment", auth, specialOrderController.markBuyerPaymentPaid);
router.put("/:id/close", auth, specialOrderController.closeSpecialOrder);

module.exports = router;
