const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../modules/application/application.model");
const ApiError = require("../utils/ApiError");
const { ROLES } = require("../utils/constants");

async function getProfile(userId) {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  return user;
}

async function updateProfile(userId, payload) {
  const allowedFields = [
    "name",
    "contactNumber",
    "bio",
    "location",
    "educationLevel",
    "university",
    "graduationYear",
    "skills",
    "linkedinUrl",
    "portfolioUrl",
    "companyName",
    "employmentPosition",
    "companyEmployeeId",
    "companyWebsite",
    "profileImage",
  ];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  });

  const updated = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updated) {
    throw new ApiError(404, "User not found.");
  }

  return updated;
}

async function getAllUsers() {
  return User.find().select("-password").sort({ createdAt: -1 });
}

async function deleteUserByAdmin(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
}

/** Public employer card (no email/phone) — for job seekers browsing companies */
async function getPublicEmployerProfile(userId) {
  const user = await User.findById(userId).select(
    "name role companyName bio location employmentPosition companyEmployeeId companyWebsite profileImage accountStatus updatedAt"
  );
  if (!user || user.role !== ROLES.EMPLOYER) {
    throw new ApiError(404, "Employer profile not found.");
  }
  if (user.accountStatus !== "approved") {
    throw new ApiError(404, "Employer profile not available.");
  }
  return user;
}

/**
 * Employer views a job seeker who has applied to at least one of this employer's jobs.
 * Optional applicationId scopes resume/cover letter to that application.
 */
async function getPublicSeekerProfileForEmployer(seekerId, employerUserId, applicationId) {
  const seeker = await User.findById(seekerId).select(
    "-password -employerProofDocument -approvalReason"
  );
  if (!seeker || seeker.role !== ROLES.JOB_SEEKER) {
    throw new ApiError(404, "Candidate profile not found.");
  }

  const employerJobIds = await Job.find({ employer: employerUserId }).distinct("_id");
  if (!employerJobIds.length) {
    throw new ApiError(403, "You are not allowed to view this profile.");
  }

  let applicationDoc = null;
  if (applicationId) {
    applicationDoc = await Application.findById(applicationId).populate("job", "title employer");
    if (!applicationDoc) {
      throw new ApiError(404, "Application not found.");
    }
    if (applicationDoc.applicant.toString() !== seekerId.toString()) {
      throw new ApiError(400, "Application does not match this candidate.");
    }
    const jobEmployer = applicationDoc.job?.employer;
    const empId = jobEmployer?._id?.toString() || jobEmployer?.toString();
    if (empId !== employerUserId.toString()) {
      throw new ApiError(403, "You are not allowed to view this application.");
    }
  } else {
    const linked = await Application.exists({
      applicant: seekerId,
      job: { $in: employerJobIds },
    });
    if (!linked) {
      throw new ApiError(403, "You can only view profiles of candidates who applied to your jobs.");
    }
    applicationDoc = await Application.findOne({
      applicant: seekerId,
      job: { $in: employerJobIds },
    })
      .sort({ appliedAt: -1 })
      .populate("job", "title employer");
  }

  const applicationPayload = applicationDoc
    ? {
        _id: applicationDoc._id,
        status: applicationDoc.status,
        resume: applicationDoc.resume || "",
        coverLetter: applicationDoc.coverLetter || "",
        appliedAt: applicationDoc.appliedAt,
        job: applicationDoc.job
          ? { _id: applicationDoc.job._id, title: applicationDoc.job.title }
          : null,
      }
    : null;

  return { user: seeker, application: applicationPayload };
}

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUserByAdmin,
  getPublicEmployerProfile,
  getPublicSeekerProfileForEmployer,
};
