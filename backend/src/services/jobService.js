const Job = require("../models/Job");
const ApiError = require("../utils/ApiError");

async function createJob(payload, employerId) {
  const job = await Job.create({
    ...payload,
    employer: employerId,
  });
  return job;
}

async function getAllJobs(query) {
  const filter = {};
  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.employer) {
    filter.employer = query.employer;
  }

  return Job.find(filter)
    .populate("employer", "name email companyName")
    .sort({ createdAt: -1 });
}

async function getJobById(jobId) {
  const job = await Job.findById(jobId).populate("employer", "name email companyName");
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }
  return job;
}

async function updateJob(jobId, employerId, payload) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }
  if (job.employer.toString() !== employerId.toString()) {
    throw new ApiError(403, "You can edit only your own jobs.");
  }

  Object.assign(job, payload);
  await job.save();
  return job;
}

async function deleteJob(jobId, employerId) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }
  if (job.employer.toString() !== employerId.toString()) {
    throw new ApiError(403, "You can delete only your own jobs.");
  }

  await Job.findByIdAndDelete(jobId);
}

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};
