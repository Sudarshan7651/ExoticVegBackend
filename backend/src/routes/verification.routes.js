const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const { auth } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// Submit verification documents
router.post('/submit', auth, verificationController.submitVerification);

// Upload verification documents
router.post('/upload', auth, uploadMultiple, verificationController.uploadVerificationDocuments);

// Get pending verifications (admin only)
router.get('/pending', auth, verificationController.getPendingVerifications);

// Process verification (admin only)
router.put('/:userId/process', auth, verificationController.processVerification);

module.exports = router;
