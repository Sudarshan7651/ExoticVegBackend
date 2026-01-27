const express = require("express");
const router = express.Router();
const savedTraderController = require("../controllers/savedTrader.controller");
const { auth } = require("../middleware/auth");

router.use(auth); // All saved trader routes require authentication

router.post("/", savedTraderController.saveTrader);
router.get("/", savedTraderController.getSavedTraders);
router.delete("/:traderId", savedTraderController.unsaveTrader);

module.exports = router;
