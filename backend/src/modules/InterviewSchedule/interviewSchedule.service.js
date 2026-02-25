const ApiError = require("../../utils/ApiError");
const { ROLES } = require("../../utils/constants");
const Application = require("../application/application.model");
const Job = require("../../models/Job");
const interviewScheduleRepository = require("./interviewSchedule.repository");
const { buildInterviewIcs } = require("../../utils/ics");
const {
  sendInterviewScheduledEmail,
  sendInterviewCancelledEmail,
} = require("../../services/emailService");

function asDate(value, fieldName) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid date/time.`);
  }
  return d;
}

function ensureNotPast(startsAt) {
  if (startsAt < new Date()) {
    throw new ApiError(400, "Interview start time cannot be in the past.");
  }
}

async function getEmployerOwnedApplication({ employerUser, applicationId }) {
  const app = await Application.findById(applicationId)
    .populate("job", "title employer")
    .populate("applicant", "name email");
  if (!app) {
    throw new ApiError(404, "Application not found.");
  }

  const job = await Job.findById(app.job?._id).populate("employer", "name email companyName");
  if (!job) {
    throw new ApiError(404, "Job not found for this application.");
  }

  if (job.employer?._id?.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "Not allowed to schedule interviews for this application.");
  }

  if (!["shortlisted", "hired"].includes(app.status)) {
    throw new ApiError(400, "Interview can be scheduled only for shortlisted/hired applications.");
  }

  return { application: app, job };
}

function buildIcsForInterview({ interviewId, startsAt, endsAt, jobTitle, companyName, meetingLink, location, notes, organizer, applicant }) {
  const summary = `Interview: ${jobTitle || "Job"}`;
  const description = [
    `Company: ${companyName || "Employer"}`,
    jobTitle ? `Role: ${jobTitle}` : null,
    meetingLink ? `Meeting link: ${meetingLink}` : null,
    notes ? `Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return buildInterviewIcs({
    uid: `${interviewId}@jobboard.local`,
    method: "REQUEST",
    startsAt,
    endsAt,
    summary,
    description,
    location: location || "",
    organizerEmail: organizer?.email,
    organizerName: organizer?.companyName || organizer?.name,
    attendeeEmail: applicant?.email,
    attendeeName: applicant?.name,
  });
}

function buildCancelIcsForInterview({ interviewId, startsAt, endsAt, jobTitle, companyName, organizer, applicant }) {
  const summary = `Interview cancelled: ${jobTitle || "Job"}`;
  const description = [`Company: ${companyName || "Employer"}`, jobTitle ? `Role: ${jobTitle}` : null].filter(Boolean).join("\n");

  return buildInterviewIcs({
    uid: `${interviewId}@jobboard.local`,
    method: "CANCEL",
    startsAt,
    endsAt,
    summary,
    description,
    location: "",
    organizerEmail: organizer?.email,
    organizerName: organizer?.companyName || organizer?.name,
    attendeeEmail: applicant?.email,
    attendeeName: applicant?.name,
  });
}

function overlapErrorMessage(overlaps) {
  const preview = overlaps
    .slice(0, 3)
    .map((i) => {
      const who = i.applicant?.name ? ` with ${i.applicant.name}` : "";
      const job = i.job?.title ? ` (${i.job.title})` : "";
      return `${new Date(i.startsAt).toLocaleString()} - ${new Date(i.endsAt).toLocaleTimeString()}${who}${job}`;
    })
    .join("; ");
  return `This time slot conflicts with an existing interview. ${preview ? `Conflicts: ${preview}` : ""}`.trim();
}

async function createInterviewSchedule({ employerUser, payload }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can schedule interviews.");
  }

  const applicationId = (payload.applicationId || "").trim();
  if (!applicationId) {
    throw new ApiError(400, "applicationId is required.");
  }

  const startsAt = asDate(payload.startsAt, "startsAt");
  const endsAt = asDate(payload.endsAt, "endsAt");
  ensureNotPast(startsAt);
  if (endsAt <= startsAt) {
    throw new ApiError(400, "endsAt must be after startsAt.");
  }

  const timezone = (payload.timezone || "UTC").trim() || "UTC";
  const meetingLink = (payload.meetingLink || "").trim();
  const location = (payload.location || "").trim();
  const notes = (payload.notes || "").trim();

  const { application, job } = await getEmployerOwnedApplication({ employerUser, applicationId });

  const overlaps = await interviewScheduleRepository.findOverlaps({
    employerId: employerUser._id,
    applicantId: application.applicant?._id,
    startsAt,
    endsAt,
    excludeInterviewId: null,
  });
  if (overlaps.length) {
    throw new ApiError(409, overlapErrorMessage(overlaps));
  }

  const interview = await interviewScheduleRepository.create({
    application: application._id,
    job: job._id,
    employer: employerUser._id,
    applicant: application.applicant?._id,
    startsAt,
    endsAt,
    timezone,
    meetingLink,
    location,
    notes,
    status: "scheduled",
  });

  // Best-effort email: do not fail schedule creation if SMTP misconfigured.
  let emailSent = false;
  let emailWarning = null;
  try {
    const ics = buildIcsForInterview({
      interviewId: interview._id,
      startsAt,
      endsAt,
      jobTitle: job.title,
      companyName: job.employer?.companyName || job.employer?.name || "Employer",
      meetingLink,
      location,
      notes,
      organizer: job.employer,
      applicant: application.applicant,
    });
    await sendInterviewScheduledEmail({
      to: application.email || application.applicant?.email,
      applicantName: application.fullName || application.applicant?.name || "Applicant",
      jobTitle: job.title,
      companyName: job.employer?.companyName || job.employer?.name || "Employer",
      startsAt,
      endsAt,
      timezone,
      meetingLink,
      location,
      notes,
      ics,
    });
    emailSent = true;
  } catch (err) {
    emailWarning = err.message;
  }

  return { interview, emailSent, emailWarning };
}

async function listInterviewSchedules({ user, query }) {
  if (!user || ![ROLES.EMPLOYER, ROLES.JOB_SEEKER].includes(user.role)) {
    throw new ApiError(403, "Not allowed to view interview schedules.");
  }

  const from = query.from ? asDate(query.from, "from") : null;
  const to = query.to ? asDate(query.to, "to") : null;
  const applicationId = (query.applicationId || "").trim() || null;

  if (user.role === ROLES.EMPLOYER) {
    // If applicationId is provided, ensure employer owns it (prevents ID probing).
    if (applicationId) {
      await getEmployerOwnedApplication({ employerUser: user, applicationId });
    }
    const interviews = await interviewScheduleRepository.findForEmployerInRange({
      employerId: user._id,
      from,
      to,
      applicationId,
    });
    return interviews;
  }

  // Job seeker: only their interviews
  const interviews = await interviewScheduleRepository.findForApplicantInRange({
    applicantId: user._id,
    from,
    to,
  });
  return interviews;
}

async function getInterviewScheduleById({ user, interviewId }) {
  const interview = await interviewScheduleRepository.findByIdPopulated(interviewId);
  if (!interview) {
    throw new ApiError(404, "Interview schedule not found.");
  }

  const isEmployerOwner = interview.employer?._id?.toString() === user._id.toString();
  const isApplicantOwner = interview.applicant?._id?.toString() === user._id.toString();
  if (!isEmployerOwner && !isApplicantOwner) {
    throw new ApiError(403, "Not allowed to view this interview schedule.");
  }

  return interview;
}

async function updateInterviewSchedule({ employerUser, interviewId, payload }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can update interview schedules.");
  }

  const existing = await interviewScheduleRepository.findByIdPopulated(interviewId);
  if (!existing) {
    throw new ApiError(404, "Interview schedule not found.");
  }
  if (existing.employer?._id?.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "Not allowed to update this interview schedule.");
  }

  const patch = {};
  if (payload.startsAt !== undefined) patch.startsAt = asDate(payload.startsAt, "startsAt");
  if (payload.endsAt !== undefined) patch.endsAt = asDate(payload.endsAt, "endsAt");
  if (patch.startsAt && patch.endsAt && patch.endsAt <= patch.startsAt) {
    throw new ApiError(400, "endsAt must be after startsAt.");
  }
  if (payload.timezone !== undefined) patch.timezone = (payload.timezone || "UTC").trim() || "UTC";
  if (payload.meetingLink !== undefined) patch.meetingLink = (payload.meetingLink || "").trim();
  if (payload.location !== undefined) patch.location = (payload.location || "").trim();
  if (payload.notes !== undefined) patch.notes = (payload.notes || "").trim();
  if (payload.status !== undefined) patch.status = payload.status;

  const nextStartsAt = patch.startsAt || existing.startsAt;
  const nextEndsAt = patch.endsAt || existing.endsAt;
  if (patch.startsAt || patch.endsAt) {
    ensureNotPast(nextStartsAt);
  }
  if (nextEndsAt <= nextStartsAt) {
    throw new ApiError(400, "endsAt must be after startsAt.");
  }

  const overlaps = await interviewScheduleRepository.findOverlaps({
    employerId: employerUser._id,
    applicantId: existing.applicant?._id,
    startsAt: nextStartsAt,
    endsAt: nextEndsAt,
    excludeInterviewId: existing._id,
  });
  if (overlaps.length) {
    throw new ApiError(409, overlapErrorMessage(overlaps));
  }

  const updated = await interviewScheduleRepository.updateById(interviewId, patch);

  let emailSent = false;
  let emailWarning = null;
  try {
    const ics = buildIcsForInterview({
      interviewId: updated._id,
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      jobTitle: updated.job?.title,
      companyName: updated.employer?.companyName || updated.employer?.name || "Employer",
      meetingLink: updated.meetingLink,
      location: updated.location,
      notes: updated.notes,
      organizer: updated.employer,
      applicant: updated.applicant,
    });
    await sendInterviewScheduledEmail({
      to: updated.applicant?.email,
      applicantName: updated.applicant?.name || "Applicant",
      jobTitle: updated.job?.title || "the role",
      companyName: updated.employer?.companyName || updated.employer?.name || "Employer",
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      timezone: updated.timezone,
      meetingLink: updated.meetingLink,
      location: updated.location,
      notes: updated.notes,
      isUpdate: true,
      ics,
    });
    emailSent = true;
  } catch (err) {
    emailWarning = err.message;
  }

  return { interview: updated, emailSent, emailWarning };
}

async function deleteInterviewSchedule({ employerUser, interviewId }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can delete interview schedules.");
  }

  const existing = await interviewScheduleRepository.findByIdPopulated(interviewId);
  if (!existing) {
    throw new ApiError(404, "Interview schedule not found.");
  }
  if (existing.employer?._id?.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "Not allowed to delete this interview schedule.");
  }

  await interviewScheduleRepository.deleteById(interviewId);

  let emailSent = false;
  let emailWarning = null;
  try {
    const ics = buildCancelIcsForInterview({
      interviewId: existing._id,
      startsAt: existing.startsAt,
      endsAt: existing.endsAt,
      jobTitle: existing.job?.title,
      companyName: existing.employer?.companyName || existing.employer?.name || "Employer",
      organizer: existing.employer,
      applicant: existing.applicant,
    });
    await sendInterviewCancelledEmail({
      to: existing.applicant?.email,
      applicantName: existing.applicant?.name || "Applicant",
      jobTitle: existing.job?.title || "the role",
      companyName: existing.employer?.companyName || existing.employer?.name || "Employer",
      startsAt: existing.startsAt,
      endsAt: existing.endsAt,
      timezone: existing.timezone,
      ics,
    });
    emailSent = true;
  } catch (err) {
    emailWarning = err.message;
  }

  return { emailSent, emailWarning };
}

async function getInterviewIcs({ user, interviewId }) {
  const interview = await getInterviewScheduleById({ user, interviewId });

  // Build a minimal invite; keep UTC timestamps for compatibility.
  const jobTitle = interview.job?.title || "Interview";
  const companyName = interview.employer?.companyName || interview.employer?.name || "Employer";
  const meetingLink = interview.meetingLink || "";
  const location = interview.location || "";
  const notes = interview.notes || "";

  const ics = buildIcsForInterview({
    interviewId: interview._id,
    startsAt: interview.startsAt,
    endsAt: interview.endsAt,
    jobTitle,
    companyName,
    meetingLink,
    location,
    notes,
    organizer: interview.employer,
    applicant: interview.applicant,
  });

  return ics;
}

module.exports = {
  createInterviewSchedule,
  listInterviewSchedules,
  getInterviewScheduleById,
  updateInterviewSchedule,
  deleteInterviewSchedule,
  getInterviewIcs,
};

