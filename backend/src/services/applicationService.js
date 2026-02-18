const Application = require("../models/Application");
const Job = require("../models/Job");
const ApiError = require("../utils/ApiError");

async function applyForJob(jobId, applicantId, coverLetter = "") {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  const existing = await Application.findOne({ job: jobId, applicant: applicantId });
  if (existing) {
    if (existing.status === "rejected") {
      // Allow re-application
      existing.status = "applied";
      existing.coverLetter = coverLetter;
      existing.createdAt = Date.now(); // Optional: update timestamp
      return existing.save();
    }
    throw new ApiError(409, "You have already applied for this job.");
  }

  return Application.create({
    job: jobId,
    applicant: applicantId,
    coverLetter,
  });
}

async function getApplicationsForJob(jobId, requester) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  const isAdmin = requester.role === "admin";
  const isOwner = job.employer.toString() === requester.id.toString();
  if (!isAdmin && !isOwner) {
    throw new ApiError(403, "Not allowed to view these applications.");
  }

  return Application.find({ job: jobId })
    .populate("applicant", "name email skills")
    .sort({ createdAt: -1 });
}

async function getMyApplications(userId) {
  return Application.find({ applicant: userId })
    .populate({
      path: "job",
      select: "title location salary employer",
      populate: { path: "employer", select: "name companyName" },
    })
    .sort({ createdAt: -1 });
}

async function updateApplicationStatus(applicationId, employerId, status) {
  const application = await Application.findById(applicationId).populate("job");
  if (!application) {
    throw new ApiError(404, "Application not found.");
  }

  if (application.job.employer.toString() !== employerId.toString()) {
    throw new ApiError(403, "Not authorized to update this application.");
  }

  application.status = status;
  return application.save();
}

module.exports = {
  applyForJob,
  getApplicationsForJob,
  getMyApplications,
  updateApplicationStatus,
};
