const jobService = require("../services/jobService");

// POST /api/jobs — Create a new job posting (employer only)
async function createJob(req, res, next) {
  try {
    const job = await jobService.createJob(req.body, req.user.id);
    res.status(201).json({ message: "Job posted successfully.", job });
  } catch (error) {
    next(error);
  }
}

// GET /api/jobs — Retrieve all jobs with pagination and search
async function getAllJobs(req, res, next) {
  try {
    const result = await jobService.getAllJobs(req.query);
    res.status(200).json({
      count: result.jobs.length,
      totalCount: result.totalCount,
      page: result.page,
      totalPages: result.totalPages,
      jobs: result.jobs,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/jobs/:id — Retrieve a single job by its ID
async function getJobById(req, res, next) {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}

// PUT /api/jobs/:id — Update an existing job (owner only)
async function updateJob(req, res, next) {
  try {
    const job = await jobService.updateJob(req.params.id, req.user.id, req.body);
    res.status(200).json({ message: "Job updated successfully.", job });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/jobs/:id — Remove a job posting (owner only)
async function deleteJob(req, res, next) {
  try {
    await jobService.deleteJob(req.params.id, req.user.id);
    res.status(200).json({ message: "Job deleted successfully." });
  } catch (error) {
    next(error);
  }
}

// GET /api/jobs/my-jobs — Get all jobs posted by the current employer
async function getMyJobs(req, res, next) {
  try {
    const jobs = await jobService.getMyJobs(req.user.id);
    res.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
};
