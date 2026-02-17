const jobService = require("../services/jobService");

async function createJob(req, res, next) {
  try {
    const job = await jobService.createJob(req.body, req.user.id);
    res.status(201).json({ message: "Job posted successfully.", job });
  } catch (error) {
    next(error);
  }
}

async function getAllJobs(req, res, next) {
  try {
    const jobs = await jobService.getAllJobs(req.query);
    res.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
}

async function getJobById(req, res, next) {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await jobService.updateJob(req.params.id, req.user.id, req.body);
    res.status(200).json({ message: "Job updated successfully.", job });
  } catch (error) {
    next(error);
  }
}

async function deleteJob(req, res, next) {
  try {
    await jobService.deleteJob(req.params.id, req.user.id);
    res.status(200).json({ message: "Job deleted successfully." });
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
};
