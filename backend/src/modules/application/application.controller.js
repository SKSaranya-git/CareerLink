const ApiError = require("../../utils/ApiError");
const applicationService = require("./application.service");

async function submitApplication(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, "Resume file is required.");
    }

    const resumePath = `/uploads/resumes/${req.file.filename}`;
    const serverBaseUrl = `${req.protocol}://${req.get("host")}`;
    const resumeUrl = `${serverBaseUrl}${resumePath}`;

    const result = await applicationService.submitApplication({
      jobId: req.params.jobId,
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

async function getMyApplications(req, res, next) {
  try {
    const applications = await applicationService.getMyApplications(req.user);
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    next(error);
  }
}

async function getApplicationsForJob(req, res, next) {
  try {
    const applications = await applicationService.getApplicationsForJob({
      jobId: req.params.jobId,
      employerUser: req.user,
    });
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const result = await applicationService.updateApplicationStatus({
      applicationId: req.params.applicationId,
      employerUser: req.user,
      status: req.body.status,
    });

    // When status is "hired", the service includes the required integration message.
    res.status(200).json({
      ...(result.message ? { message: result.message } : { message: "Application status updated." }),
      emailSent: result.emailSent,
      emailWarning: result.emailWarning,
      application: result.application,
    });
  } catch (error) {
    next(error);
  }
}

async function adminGetAll(req, res, next) {
  try {
    const applications = await applicationService.adminGetAllApplications(req.user);
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    next(error);
  }
}

async function employerGetShortlisted(req, res, next) {
  try {
    const applications = await applicationService.employerGetShortlistedApplications(req.user);
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitApplication,
  getMyApplications,
  getApplicationsForJob,
  updateStatus,
  adminGetAll,
  employerGetShortlisted,
};

