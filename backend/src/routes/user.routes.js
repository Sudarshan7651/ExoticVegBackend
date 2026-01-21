const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { auth, isAdmin } = require("../middleware/auth");

// Routes
router.get("/", auth, isAdmin, userController.getAllUsers);
router.get("/traders", userController.getTraders);
router.get("/stats", auth, userController.getUserStats);
router.get("/:id", auth, userController.getUserById);
router.put("/profile", auth, userController.updateProfile);
router.put("/:id", auth, isAdmin, userController.updateUser);
router.delete("/:id", auth, isAdmin, userController.deleteUser);

module.exports = router;
