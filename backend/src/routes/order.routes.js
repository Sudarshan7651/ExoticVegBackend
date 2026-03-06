const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const { auth, isTrader, isAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

// Validation rules
const orderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must have at least one item"),
  body("items.*.vegetableId")
    .notEmpty()
    .withMessage("Vegetable ID is required"),
  body("items.*.quantity")
    .isNumeric()
    .withMessage("Quantity must be a number")
    .custom((val) => val >= 1)
    .withMessage("Quantity must be at least 1"),
];

const statusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .withMessage("Invalid status"),
];

// Routes
router.get("/", auth, orderController.getAllOrders);
router.get("/stats", auth, orderController.getOrderStats);
router.get("/:id", auth, orderController.getOrderById);
router.post("/", auth, orderValidation, validate, orderController.createOrder);
router.post("/market", auth, orderController.createMarketOrder);
router.put(
  "/:id/status",
  auth,
  isTrader,
  statusValidation,
  validate,
  orderController.updateOrderStatus,
);
router.put("/:id/cancel", auth, orderController.cancelOrder);

module.exports = router;
