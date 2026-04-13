const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const vegetableController = require('../controllers/vegetable.controller');
const { auth, isTrader } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Validation rules
const vegetableValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Vegetable name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isNumeric().withMessage('Quantity must be a number')
    .custom(val => val >= 0).withMessage('Quantity cannot be negative'),
  body('rate')
    .notEmpty().withMessage('Rate is required')
    .isNumeric().withMessage('Rate must be a number')
    .custom(val => val >= 0).withMessage('Rate cannot be negative'),
  body('unit')
    .optional()
    .isIn(['kg', 'g', 'pieces', 'bunches', 'boxes']).withMessage('Invalid unit'),
  body('category')
    .optional()
    .isIn(['Leafy Greens', 'Root Vegetables', 'Exotic', 'Herbs', 'Mushrooms', 'Microgreens', 'Other'])
    .withMessage('Invalid category')
];

// Public routes
router.get('/', vegetableController.getAllVegetables);
router.get('/categories', vegetableController.getCategories);
router.get('/trader/:traderId', vegetableController.getVegetablesByTrader);
router.get('/suggestions', vegetableController.getVegetableSuggestions);
router.get('/:id', vegetableController.getVegetableById);

// Protected routes (Trader only)
router.post('/', auth, isTrader, vegetableValidation, validate, vegetableController.createVegetable);
router.put('/:id', auth, isTrader, vegetableController.updateVegetable);
router.delete('/:id', auth, isTrader, vegetableController.deleteVegetable);

module.exports = router;
