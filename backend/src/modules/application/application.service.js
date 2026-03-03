const Job = require("../../models/Job");
const ApiError = require("../../utils/ApiError");
const { ROLES } = require("../../utils/constants");
const applicationRepository = require("./application.repository");
const {
  sendApplicationReceivedEmail,
  sendApplicationStatusUpdatedEmail,
  sendApplicantApplicationCopyEmail,
  sendEmployerNewApplicationEmail,
} = require("../../services/emailService");

async function submitApplication({ jobId, applicantUser, payload, resumePath, resumeUrl }) {
  if (!applicantUser || applicantUser.role !== ROLES.JOB_SEEKER) {
    throw new ApiError(403, "Only job seekers can apply for jobs.");
  }

  const job = await Job.findById(jobId).populate("employer", "name email companyName");
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }

  const existing = await applicationRepository.findOneByJobAndApplicant(jobId, applicantUser._id);
  if (existing) {
    throw new ApiError(409, "You have already applied for this job.");
  }

  const application = await applicationRepository.create({
    job: jobId,
    applicant: applicantUser._id,
    fullName: (payload.fullName || applicantUser.name || "").trim(),
    email: (payload.email || applicantUser.email || "").trim().toLowerCase(),
    phone: (payload.phone || applicantUser.contactNumber || "").trim(),
    coverLetter: (payload.coverLetter || "").trim(),
    resume: resumePath,
    status: "pending",
  });

  // Emails are best-effort: we don't fail the application creation if SMTP misconfigured.
  const emailResults = {
    applicantConfirmationSent: false,
    applicantCopySent: false,
    employerNotified: false,
    warnings: [],
  };

  const companyName = job.employer?.companyName || job.employer?.name || "Employer";
  const applicantName = application.fullName || "Applicant";
  const applicantEmail = application.email;

  try {
    await sendApplicationReceivedEmail({
      to: applicantEmail,
      name: applicantName,
      jobTitle: job.title,
      companyName,
    });
    emailResults.applicantConfirmationSent = true;
  } catch (err) {
    emailResults.warnings.push(`Applicant confirmation email failed: ${err.message}`);
  }

  const sendCopyToEmail =
    payload?.sendCopyToEmail === true ||
    payload?.sendCopyToEmail === "true" ||
    payload?.sendCopyToEmail === "1";

  if (sendCopyToEmail) {
    try {
      await sendApplicantApplicationCopyEmail({
        to: applicantEmail,
        name: applicantName,
        jobTitle: job.title,
        companyName,
        phone: application.phone,
        coverLetter: application.coverLetter,
        resumeUrl: resumeUrl || application.resume,
        appliedAt: application.appliedAt,
      });
      emailResults.applicantCopySent = true;
    } catch (err) {
      emailResults.warnings.push(`Applicant copy email failed: ${err.message}`);
    }
  }

  try {
    await sendEmployerNewApplicationEmail({
      to: job.employer?.email,
      employerName: job.employer?.name,
      jobTitle: job.title,
      companyName,
      applicantName,
      applicantEmail,
      applicantPhone: application.phone,
      coverLetter: application.coverLetter,
      resumeUrl: resumeUrl || application.resume,
      appliedAt: application.appliedAt,
    });
    emailResults.employerNotified = true;
  } catch (err) {
    emailResults.warnings.push(`Employer notification email failed: ${err.message}`);
  }

  return { application, emailResults };
}

async function getMyApplications(applicantUser) {
  if (!applicantUser || applicantUser.role !== ROLES.JOB_SEEKER) {
    throw new ApiError(403, "Only job seekers can view their applications.");
  }
  return applicationRepository.findByApplicant(applicantUser._id);
}

async function getApplicationsForJob({ jobId, employerUser }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can view job applications.");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, "Job not found.");
  }
  if (job.employer.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "Not allowed to view applications for this job.");
  }

  return applicationRepository.findByJob(jobId);
}

async function updateApplicationStatus({ applicationId, employerUser, status }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can update application status.");
  }

  const app = await applicationRepository.findByIdPopulated(applicationId);
  if (!app) {
    throw new ApiError(404, "Application not found.");
  }

  // Ensure only job owner can update.
  const jobEmployerId = app.job?.employer;
  if (!jobEmployerId || jobEmployerId.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "Not allowed to update applications for this job.");
  }

  const wasStatus = app.status;
  const updated = await applicationRepository.updateStatus(applicationId, status);

  let emailSent = false;
  let emailWarning = null;
  if (wasStatus !== status) {
    try {
      await sendApplicationStatusUpdatedEmail({
        to: updated.email || updated.applicant?.email,
        name: updated.fullName || updated.applicant?.name || "Applicant",
        status,
        jobTitle: updated.job?.title || "the role",
      });
      emailSent = true;
    } catch (err) {
      emailWarning = err.message;
    }
  }

  const extra =
    status === "hired"
      ? { message: "Candidate marked as hired. Proceed to interview scheduling." }
      : {};

  return { application: updated, emailSent, emailWarning, ...extra };
}

async function adminGetAllApplications(adminUser) {
  if (!adminUser || adminUser.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admins can view all applications.");
  }
  return applicationRepository.findAll();
}

async function employerGetShortlistedApplications(employerUser) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can view shortlisted applications.");
  }

  // Find all jobs owned by this employer, then fetch shortlisted applications.
  const myJobs = await Job.find({ employer: employerUser._id }).select("_id");
  const myJobIds = myJobs.map((j) => j._id);
  if (myJobIds.length === 0) return [];

  return applicationRepository.findByJobIdsAndStatus(myJobIds, "shortlisted");
}

async function getApplicationByIdForUser({ user, applicationId }) {
  if (!user || ![ROLES.EMPLOYER, ROLES.JOB_SEEKER, ROLES.ADMIN].includes(user.role)) {
    throw new ApiError(403, "Not allowed to view application.");
  }

  const app = await applicationRepository.findByIdPopulated(applicationId);
  if (!app) {
    throw new ApiError(404, "Application not found.");
  }

  if (user.role === ROLES.ADMIN) return app;

  if (user.role === ROLES.JOB_SEEKER) {
    if (app.applicant?._id?.toString() !== user._id.toString()) {
      throw new ApiError(403, "Not allowed to view this application.");
    }
    return app;
  }

  // Employer: only job owner can view.
  if (app.job?.employer?.toString() !== user._id.toString()) {
    throw new ApiError(403, "Not allowed to view applications for this job.");
  }
  return app;
}

async function deleteApplicationForUser({ user, applicationId }) {
  if (!user || ![ROLES.EMPLOYER, ROLES.JOB_SEEKER, ROLES.ADMIN].includes(user.role)) {
    throw new ApiError(403, "Not allowed to delete application.");
  }

  const app = await applicationRepository.findByIdPopulated(applicationId);
  if (!app) {
    throw new ApiError(404, "Application not found.");
  }

  if (user.role === ROLES.ADMIN) {
    await applicationRepository.deleteById(applicationId);
    return;
  }

  if (user.role === ROLES.JOB_SEEKER) {
    if (app.applicant?._id?.toString() !== user._id.toString()) {
      throw new ApiError(403, "Not allowed to delete this application.");
    }
    await applicationRepository.deleteById(applicationId);
    return;
  }

  if (app.job?.employer?.toString() !== user._id.toString()) {
    throw new ApiError(403, "Not allowed to delete applications for this job.");
  }
  await applicationRepository.deleteById(applicationId);
}

module.exports = {
  submitApplication,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
  adminGetAllApplications,
  employerGetShortlistedApplications,
  getApplicationByIdForUser,
  deleteApplicationForUser,
};

