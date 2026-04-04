const Job = require("../models/Job");
const ApiError = require("../utils/ApiError");

function normalizeEmploymentType(value) {
  if (value === undefined || value === null) return value;
  const raw = Array.isArray(value) ? value : [value];
  const allowed = new Set(["full-time", "part-time", "internship", "contract"]);
  return Array.from(
    new Set(
      raw
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => allowed.has(t))
    )
  );
}

async function createJob(payload, employerId) {
  const normalizedPayload = {
    ...payload,
    employmentType: normalizeEmploymentType(payload.employmentType),
  };
  const job = await Job.create({
    ...normalizedPayload,
    employer: employerId,
  });
  return job;
}

async function getAllJobs(query) {
  const searchFilter = {};
  if (query.search) {
    searchFilter.$text = { $search: query.search };
  }

  return Job.find(searchFilter)
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

  const normalizedPayload = { ...payload };
  if (Object.prototype.hasOwnProperty.call(payload, "employmentType")) {
    normalizedPayload.employmentType = normalizeEmploymentType(payload.employmentType);
  }
  Object.assign(job, normalizedPayload);
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
