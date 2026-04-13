const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { auth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

// Validation rules
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9]{10}$/)
    .withMessage("Please enter a valid 10-digit phone number"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/^(?=.*[A-Z])/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/^(?=.*[0-9])/)
    .withMessage("Password must contain at least one number")
    .matches(/^(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage("Password must contain at least one special character"),
  body("role")
    .optional()
    .isIn(["buyer", "trader"])
    .withMessage("Role must be buyer or trader"),
  body("businessName")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Business name must be 3-100 characters"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const passwordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// Routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.get("/me", auth, authController.getMe);
router.put(
  "/password",
  auth,
  passwordValidation,
  validate,
  authController.updatePassword,
);
router.post("/logout", auth, authController.logout);
router.get("/verify", auth, authController.verifyToken);

module.exports = router;
