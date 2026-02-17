const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
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

module.exports = {
  getOverview,
  getPendingEmployers,
  reviewEmployerRegistration,
};
