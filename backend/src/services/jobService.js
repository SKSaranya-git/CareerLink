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
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "50"), 10) || 50));

  const filter = {};
  const search = String(query.search ?? "").trim();
  if (search) {
    filter.$text = { $search: search };
  }

  const minSalary = query.minSalary != null && String(query.minSalary).trim() !== "" ? Number(query.minSalary) : null;
  if (Number.isFinite(minSalary) && minSalary >= 0) {
    filter.salary = { $gte: minSalary };
  }

  const employmentType = String(query.employmentType ?? query.jobType ?? "").trim();
  if (employmentType) {
    filter.employmentType = employmentType;
  }

  const datePosted = String(query.datePosted ?? "").trim();
  if (datePosted === "24h" || datePosted === "7d" || datePosted === "30d") {
    const days = datePosted === "24h" ? 1 : datePosted === "7d" ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    filter.createdAt = { $gte: since };
  }

  const total = await Job.countDocuments(filter);

  let q = Job.find(filter).populate("employer", "name email companyName");
  if (search) {
    q = q
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" }, createdAt: -1 });
  } else {
    q = q.sort({ createdAt: -1 });
  }

  const jobs = await q
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { jobs, total, page, limit, totalPages };
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
