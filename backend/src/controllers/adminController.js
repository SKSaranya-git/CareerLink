const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const AdminNotification = require("../models/AdminNotification");
const ApiError = require("../utils/ApiError");
const { sendEmployerDecisionEmail } = require("../services/emailService");

async function getOverview(req, res, next) {
  try {
    const [usersCount, jobsCount, applicationsCount, pendingEmployers, recentUsers, recentJobs] =
      await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      User.countDocuments({ role: "employer", accountStatus: "pending" }),
      User.find().select("-password").sort({ createdAt: -1 }).limit(5),
      Job.find().populate("employer", "name email companyName").sort({ createdAt: -1 }).limit(5),
      ]);

    res.status(200).json({
      stats: {
        usersCount,
        jobsCount,
        applicationsCount,
        pendingEmployers,
      },
      recentUsers,
      recentJobs,
    });
  } catch (error) {
    next(error);
  }
}

async function getPendingEmployers(req, res, next) {
  try {
    const pendingEmployers = await User.find({
      role: "employer",
      accountStatus: "pending",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: pendingEmployers.length,
      pendingEmployers,
    });
  } catch (error) {
    next(error);
  }
}

async function reviewEmployerRegistration(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      throw new ApiError(400, "Status must be approved or rejected.");
    }
    if (status === "rejected" && !reason?.trim()) {
      throw new ApiError(400, "Rejection reason is required.");
    }

    const employer = await User.findById(id);
    if (!employer || employer.role !== "employer") {
      throw new ApiError(404, "Employer not found.");
    }

    employer.accountStatus = status;
    employer.approvalReason = status === "rejected" ? reason.trim() : "";
    await employer.save();

    let emailWarning = null;
    try {
      await sendEmployerDecisionEmail({
        to: employer.email,
        name: employer.name,
        status,
        reason: employer.approvalReason,
      });
    } catch (emailError) {
      emailWarning = `Decision saved, but email failed: ${emailError.message}`;
    }

    res.status(200).json({
      message: emailWarning
        ? `Employer registration ${status}. ${emailWarning}`
        : `Employer registration ${status}. Email sent successfully.`,
      emailSent: !emailWarning,
      emailWarning,
      employer: {
        id: employer._id,
        name: employer.name,
        email: employer.email,
        companyName: employer.companyName,
        accountStatus: employer.accountStatus,
        approvalReason: employer.approvalReason,
      },
    });
  } catch (error) {
    next(error);
  }
}

function getDateRange(days = 7) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start, end };
}

function buildDateBuckets(startDate, days = 7) {
  const buckets = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + i);
    const iso = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets.push({
      date: iso,
      label,
      users: 0,
      jobs: 0,
      applications: 0,
    });
  }
  return buckets;
}

async function getAnalytics(req, res, next) {
  try {
    const { start, end } = getDateRange(7);
    const buckets = buildDateBuckets(start, 7);
    const bucketMap = new Map(buckets.map((b) => [b.date, b]));

    const [totals, usersByDay, jobsByDay, applicationsByDay, roleDistribution, statusDistribution] =
      await Promise.all([
        Promise.all([
          User.countDocuments(),
          Job.countDocuments(),
          Application.countDocuments(),
          User.countDocuments({ role: "employer", accountStatus: "pending" }),
          AdminNotification.countDocuments({ isActive: true }),
        ]),
        User.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        ]),
        Job.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        ]),
        Application.aggregate([
          { $match: { appliedAt: { $gte: start, $lte: end } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } }, count: { $sum: 1 } } },
        ]),
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ]);

    usersByDay.forEach((row) => {
      const bucket = bucketMap.get(row._id);
      if (bucket) bucket.users = row.count;
    });
    jobsByDay.forEach((row) => {
      const bucket = bucketMap.get(row._id);
      if (bucket) bucket.jobs = row.count;
    });
    applicationsByDay.forEach((row) => {
      const bucket = bucketMap.get(row._id);
      if (bucket) bucket.applications = row.count;
    });

    const [usersCount, jobsCount, applicationsCount, pendingEmployers, activeNotifications] = totals;

    res.status(200).json({
      totals: {
        usersCount,
        jobsCount,
        applicationsCount,
        pendingEmployers,
        activeNotifications,
      },
      dailyActivity: buckets,
      roleDistribution: roleDistribution.map((item) => ({ role: item._id, count: item.count })),
      applicationStatusDistribution: statusDistribution.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      lastUpdatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

async function listNotifications(req, res, next) {
  try {
    const notifications = await AdminNotification.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
}

async function getNotificationById(req, res, next) {
  try {
    const notification = await AdminNotification.findById(req.params.id).populate("createdBy", "name email");
    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    res.status(200).json({ notification });
  } catch (error) {
    next(error);
  }
}

async function createNotification(req, res, next) {
  try {
    const { title, message, type, isActive, audienceRoles } = req.body;
    const notification = await AdminNotification.create({
      title: title.trim(),
      message: message.trim(),
      type,
      isActive: typeof isActive === "boolean" ? isActive : true,
      audienceRoles: Array.isArray(audienceRoles) && audienceRoles.length ? audienceRoles : ["all"],
      createdBy: req.user._id,
    });

    const populated = await AdminNotification.findById(notification._id).populate("createdBy", "name email");
    res.status(201).json({ message: "Notification created.", notification: populated });
  } catch (error) {
    next(error);
  }
}

async function updateNotification(req, res, next) {
  try {
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title.trim();
    if (req.body.message !== undefined) updateData.message = req.body.message.trim();
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.audienceRoles !== undefined) {
      updateData.audienceRoles =
        Array.isArray(req.body.audienceRoles) && req.body.audienceRoles.length
          ? req.body.audienceRoles
          : ["all"];
    }

    const notification = await AdminNotification.findByIdAndUpdate(req.params.id, updateData, {
      runValidators: true,
      returnDocument: "after",
    }).populate("createdBy", "name email");

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    res.status(200).json({ message: "Notification updated.", notification });
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const notification = await AdminNotification.findByIdAndDelete(req.params.id);
    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }
    res.status(200).json({ message: "Notification deleted." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOverview,
  getPendingEmployers,
  reviewEmployerRegistration,
  getAnalytics,
  listNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
};
