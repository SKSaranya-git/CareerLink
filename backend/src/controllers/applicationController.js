const ApiError = require("../utils/ApiError");
const applicationService = require("../modules/application/application.service");

async function applyForJob(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, "Resume file is required.");
    }

    const resumePath = `/uploads/resumes/${req.file.filename}`;
    const serverBaseUrl = `${req.protocol}://${req.get("host")}`;
    const resumeUrl = `${serverBaseUrl}${resumePath}`;
    const result = await applicationService.submitApplication({
      jobId: req.params.id,
      applicantUser: req.user,
      payload: req.body,
      resumePath,
      resumeUrl,
    });

    res.status(201).json({
      message: "Application submitted successfully.",
      emails: result.emailResults,
      application: result.application,
    });
  } catch (error) {
    next(error);
  }
}

async function getApplicationsForJob(req, res, next) {
  try {
    const applications = await applicationService.getApplicationsForJob({
      jobId: req.params.id,
      employerUser: req.user,
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
