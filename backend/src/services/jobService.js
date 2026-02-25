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
  const searchFilter = {};
  if (query.search) {
    searchFilter.$text = { $search: query.search };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [jobs, totalCount] = await Promise.all([
    Job.find(searchFilter)
      .populate("employer", "name email companyName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(searchFilter),
  ]);

  return { jobs, totalCount, page, totalPages: Math.ceil(totalCount / limit) };
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

async function getMyJobs(employerId) {
  return Job.find({ employer: employerId })
    .populate("employer", "name email companyName")
    .sort({ createdAt: -1 });
}

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
};
