const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const { sendEmployerDecisionEmail } = require("../services/emailService");

function getLastNDates(days) {
  const dates = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    dates.push(d);
  }

  return dates;
}

function buildSeriesMap(dates) {
  const map = {};
  dates.forEach((date) => {
    map[date.toISOString().slice(0, 10)] = 0;
  });
  return map;
}

async function getAnalytics(req, res, next) {
  try {
    const dates = getLastNDates(7);
    const rangeStart = new Date(dates[0]);
    const rangeEnd = new Date(dates[dates.length - 1]);
    rangeEnd.setHours(23, 59, 59, 999);

    const [
      userSeriesRaw,
      jobSeriesRaw,
      applicationSeriesRaw,
      notificationSeriesRaw,
      usersByRole,
      appsByStatus,
      totalNotifications,
      allNotifications,
    ] =
      await Promise.all([
        User.aggregate([
          { $match: { createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
        ]),
        Job.aggregate([
          { $match: { createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
        ]),
        Application.aggregate([
          { $match: { appliedAt: { $gte: rangeStart, $lte: rangeEnd } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } },
              count: { $sum: 1 },
            },
          },
        ]),
        Notification.aggregate([
          { $match: { createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
        ]),
        User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
        Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Notification.countDocuments(),
        Notification.find().select("targetRoles acknowledgedBy").lean(),
      ]);

    const usersMap = buildSeriesMap(dates);
    const jobsMap = buildSeriesMap(dates);
    const applicationsMap = buildSeriesMap(dates);
    const notificationsMap = buildSeriesMap(dates);

    userSeriesRaw.forEach((row) => {
      usersMap[row._id] = row.count;
    });
    jobSeriesRaw.forEach((row) => {
      jobsMap[row._id] = row.count;
    });
    applicationSeriesRaw.forEach((row) => {
      applicationsMap[row._id] = row.count;
    });
    notificationSeriesRaw.forEach((row) => {
      notificationsMap[row._id] = row.count;
    });

    const timeline = dates.map((date) => {
      const key = date.toISOString().slice(0, 10);
      return {
        day: key,
        users: usersMap[key] || 0,
        jobs: jobsMap[key] || 0,
        applications: applicationsMap[key] || 0,
        notifications: notificationsMap[key] || 0,
      };
    });

    const roleBreakdown = usersByRole.map((row) => ({ role: row._id, count: row.count }));
    const applicationStatusBreakdown = appsByStatus.map((row) => ({
      status: row._id,
      count: row.count,
    }));
    const usersByRoleMap = usersByRole.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});
    const totalTargetedRecipients = allNotifications.reduce((sum, notification) => {
      const recipientsForNotification = (notification.targetRoles || []).reduce(
        (roleSum, role) => roleSum + (usersByRoleMap[role] || 0),
        0
      );
      return sum + recipientsForNotification;
    }, 0);
    const totalAcknowledgements = allNotifications.reduce((sum, notification) => {
      return sum + ((notification.acknowledgedBy || []).length || 0);
    }, 0);
    const notificationsLast7Days = timeline.reduce((sum, day) => sum + day.notifications, 0);
    const acknowledgementRate =
      totalTargetedRecipients > 0
        ? Math.round((totalAcknowledgements / totalTargetedRecipients) * 100)
        : 0;

    res.status(200).json({
      timeline,
      roleBreakdown,
      applicationStatusBreakdown,
      notificationSummary: {
        totalNotifications,
        notificationsLast7Days,
        totalTargetedRecipients,
        totalAcknowledgements,
        acknowledgementRate,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

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

module.exports = {
  getAnalytics,
  getOverview,
  getPendingEmployers,
  reviewEmployerRegistration,
};
