const express = require('express');
const router = express.Router();
const orderModificationController = require('../controllers/orderModification.controller');
const { auth } = require('../middleware/auth');

// Create modification request
router.post('/', auth, orderModificationController.createModificationRequest);

// Get modifications for an order
router.get('/order/:orderId', auth, orderModificationController.getOrderModifications);

// Get user's modification requests
router.get('/my', auth, orderModificationController.getUserModifications);

// Process modification request
router.put('/:id/process', auth, orderModificationController.processModificationRequest);

module.exports = router;
