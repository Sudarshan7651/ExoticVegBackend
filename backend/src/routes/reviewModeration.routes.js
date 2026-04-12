const express = require('express');
const router = express.Router();
const reviewModerationController = require('../controllers/reviewModeration.controller');
const { auth } = require('../middleware/auth');

// Get pending reviews for moderation
router.get('/pending', auth, reviewModerationController.getPendingReviews);

// Get all reviews with optional status filter
router.get('/', auth, reviewModerationController.getAllReviews);

// Moderate review (approve/reject)
router.put('/:id/moderate', auth, reviewModerationController.moderateReview);

module.exports = router;
