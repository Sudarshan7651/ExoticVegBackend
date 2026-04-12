const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refund.controller');
const { auth } = require('../middleware/auth');

// Create refund request
router.post('/', auth, refundController.createRefundRequest);

// Get all refund requests (admin only - would need admin middleware)
router.get('/all', auth, refundController.getAllRefundRequests);

// Get user's refund requests
router.get('/my', auth, refundController.getUserRefundRequests);

// Process refund request (admin only)
router.put('/:id/process', auth, refundController.processRefundRequest);

module.exports = router;
