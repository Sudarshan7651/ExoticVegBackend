const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { auth } = require("../middleware/auth");

router.get("/", auth, notificationController.getNotifications);
router.get("/unread-count", auth, notificationController.getUnreadCount);
router.put("/read-all", auth, notificationController.markAllAsRead);
router.put("/:id/read", auth, notificationController.markAsRead);
router.delete("/all", auth, notificationController.deleteAllNotifications);

module.exports = router;
