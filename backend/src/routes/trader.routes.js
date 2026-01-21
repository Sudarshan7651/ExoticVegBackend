const express = require("express");
const router = express.Router();

const traderController = require("../controllers/trader.controller");
const { auth, isTrader, isAdmin } = require("../middleware/auth");

// Protected routes - must be BEFORE /:id to avoid route conflict
router.get("/dashboard/stats", auth, isTrader, traderController.getTraderStats);

// Public routes
router.get("/", traderController.getAllTraders);
router.get("/:id", traderController.getTraderById);

// Protected admin routes
router.put("/:id/verify", auth, isAdmin, traderController.verifyTrader);

module.exports = router;
