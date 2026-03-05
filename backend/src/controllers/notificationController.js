const Notification = require("../models/Notification");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

function buildRecipientProjection(role, userId) {
  return [
    { $match: { targetRoles: role } },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        acknowledged: { $in: [userId, "$acknowledgedBy"] },
      },
    },
    {
      $project: {
        title: 1,
        message: 1,
        targetRoles: 1,
        createdAt: 1,
        updatedAt: 1,
        acknowledged: 1,
      },
    },
  ];
}

async function createNotification(req, res, next) {
  try {
    const { title, message, targetRoles } = req.body;
    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      targetRoles,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Notification created successfully.",
      notification,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllNotifications(req, res, next) {
  try {
    const notifications = await Notification.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const roles = [
      ...new Set(
        notifications.flatMap((item) =>
          Array.isArray(item.targetRoles) ? item.targetRoles : []
        )
      ),
    ];

    const userCountsByRoleRows = roles.length
      ? await User.aggregate([
          { $match: { role: { $in: roles } } },
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ])
      : [];

    const usersByRole = userCountsByRoleRows.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});

    const enrichedNotifications = notifications.map((item) => {
      const totalRecipients = (item.targetRoles || []).reduce((sum, role) => {
        return sum + (usersByRole[role] || 0);
      }, 0);
      const acknowledgedCount = Array.isArray(item.acknowledgedBy)
        ? item.acknowledgedBy.length
        : 0;
      const acknowledgementRate =
        totalRecipients > 0 ? Math.round((acknowledgedCount / totalRecipients) * 100) : 0;

      return {
        ...item,
        totalRecipients,
        acknowledgedCount,
        acknowledgementRate,
      };
    });

    res.status(200).json({
      count: enrichedNotifications.length,
      notifications: enrichedNotifications,
    });
  } catch (error) {
    next(error);
  }
}

async function getNotificationById(req, res, next) {
  try {
    const notification = await Notification.findById(req.params.id).populate(
      "createdBy",
      "name email role"
    );
    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    res.status(200).json({ notification });
  } catch (error) {
    next(error);
  }
}

async function updateNotification(req, res, next) {
  try {
    const { title, message, targetRoles } = req.body;

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    notification.title = title.trim();
    notification.message = message.trim();
    notification.targetRoles = targetRoles;
    await notification.save();

    res.status(200).json({
      message: "Notification updated successfully.",
      notification,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    next(error);
  }
}

async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const notifications = await Notification.aggregate(buildRecipientProjection(role, userId));
    const unreadCount = notifications.filter((item) => !item.acknowledged).length;

    res.status(200).json({
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
}

async function acknowledgeNotification(req, res, next) {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }
    if (!notification.targetRoles.includes(req.user.role)) {
      throw new ApiError(403, "You cannot access this notification.");
    }

    await Notification.updateOne(
      { _id: notification._id },
      { $addToSet: { acknowledgedBy: req.user._id } }
    );

    res.status(200).json({ message: "Notification acknowledged." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getMyNotifications,
  acknowledgeNotification,
};
