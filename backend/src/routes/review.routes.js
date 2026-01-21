const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { auth } = require("../middleware/auth");

router.post("/", auth, reviewController.createReview);
router.get("/trader/:traderId", reviewController.getTraderReviews);

module.exports = router;
