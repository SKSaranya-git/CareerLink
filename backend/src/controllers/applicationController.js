const applicationService = require("../services/applicationService");

async function applyForJob(req, res, next) {
  try {
    const application = await applicationService.applyForJob(
      req.params.id,
      req.user.id,
      req.body.coverLetter
    );
    res.status(201).json({
      message: "Application submitted successfully.",
      application,
    });
  } catch (error) {
    next(error);
  }
}

async function getApplicationsForJob(req, res, next) {
  try {
    const applications = await applicationService.getApplicationsForJob(req.params.id, {
      id: req.user.id,
      role: req.user.role,
    });
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyForJob,
  getApplicationsForJob,
};
