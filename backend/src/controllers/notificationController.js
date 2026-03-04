const AdminNotification = require("../models/AdminNotification");
const ApiError = require("../utils/ApiError");

async function listForCurrentUser(req, res, next) {
  try {
    const role = req.user.role;
    const userId = req.user._id.toString();

    const notifications = await AdminNotification.find({
      isActive: true,
      audienceRoles: { $in: ["all", role] },
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const mapped = notifications.map((notification) => {
      const ack = notification.acknowledgedBy?.find((entry) => entry.user?.toString() === userId);
      return {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        audienceRoles: notification.audienceRoles,
        isActive: notification.isActive,
        createdBy: notification.createdBy,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        acknowledged: !!ack,
        acknowledgedAt: ack?.acknowledgedAt || null,
      };
    });

    res.status(200).json({
      count: mapped.length,
      unreadCount: mapped.filter((item) => !item.acknowledged).length,
      notifications: mapped,
    });
  } catch (error) {
    next(error);
  }
}

async function acknowledge(req, res, next) {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    const notification = await AdminNotification.findOne({
      _id: req.params.id,
      isActive: true,
      audienceRoles: { $in: ["all", role] },
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found for this user.");
    }

    const alreadyAcknowledged = notification.acknowledgedBy.some(
      (entry) => entry.user?.toString() === userId.toString()
    );

    if (!alreadyAcknowledged) {
      notification.acknowledgedBy.push({ user: userId, acknowledgedAt: new Date() });
      await notification.save();
    }

    const ackEntry = notification.acknowledgedBy.find((entry) => entry.user?.toString() === userId.toString());

    res.status(200).json({
      message: alreadyAcknowledged ? "Already acknowledged." : "Notification acknowledged.",
      notificationId: notification._id,
      acknowledgedAt: ackEntry?.acknowledgedAt || null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listForCurrentUser,
  acknowledge,
};
