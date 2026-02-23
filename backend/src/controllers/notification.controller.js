const { Notification } = require("../models");
const socketIO = require("../utils/socket");

/**
 * @desc    Get all notifications for user
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
    });
  }
};

/**
 * @desc    Get unread notifications count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.userId, isRead: false },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
    });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification",
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.userId, isRead: false } },
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notifications",
    });
  }
};

/**
 * @desc    Create a notification helper (Internal)
 */
const createNotification = async (
  userId,
  title,
  message,
  type,
  relatedId = null,
) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedId,
    });

    // Emit socket event for real-time updates
    socketIO.emitToUser(userId, "new_notification", { notification });

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

/**
 * @desc    Delete all notifications for user
 * @route   DELETE /api/notifications/all
 * @access  Private
 */
const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.destroy({
      where: { userId: req.userId },
    });

    res.json({
      success: true,
      message: "All notifications deleted",
    });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notifications",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteAllNotifications,
};
