const InterviewSchedule = require("./interviewSchedule.model");

async function create(data) {
  return InterviewSchedule.create(data);
}

async function findById(interviewId) {
  return InterviewSchedule.findById(interviewId);
}

async function findByIdPopulated(interviewId) {
  return InterviewSchedule.findById(interviewId)
    .populate("job", "title location")
    .populate("application", "status")
    .populate("applicant", "name email")
    .populate("employer", "name email companyName");
}

async function findForEmployerInRange({ employerId, from, to, applicationId }) {
  const filter = { employer: employerId };

  if (from || to) {
    filter.startsAt = {};
    if (from) filter.startsAt.$gte = from;
    if (to) filter.startsAt.$lt = to;
  }

  if (applicationId) {
    filter.application = applicationId;
  }

  return InterviewSchedule.find(filter)
    .populate("job", "title location")
    .populate("applicant", "name email")
    .sort({ startsAt: 1 });
}

async function findForApplicantInRange({ applicantId, from, to }) {
  const filter = { applicant: applicantId };

  if (from || to) {
    filter.startsAt = {};
    if (from) filter.startsAt.$gte = from;
    if (to) filter.startsAt.$lt = to;
  }

  return InterviewSchedule.find(filter)
    .populate("job", "title location")
    .populate("employer", "name email companyName")
    .sort({ startsAt: 1 });
}

async function updateById(interviewId, patch) {
  return InterviewSchedule.findByIdAndUpdate(interviewId, { $set: patch }, { new: true, runValidators: true })
    .populate("job", "title location")
    .populate("applicant", "name email")
    .populate("employer", "name email companyName");
}

async function deleteById(interviewId) {
  return InterviewSchedule.findByIdAndDelete(interviewId);
}

async function findOverlaps({ employerId, applicantId, startsAt, endsAt, excludeInterviewId }) {
  const filter = {
    status: "scheduled",
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
    $or: [{ employer: employerId }, { applicant: applicantId }],
  };

  if (excludeInterviewId) {
    filter._id = { $ne: excludeInterviewId };
  }

  return InterviewSchedule.find(filter)
    .populate("job", "title")
    .populate("applicant", "name email")
    .populate("employer", "name email companyName")
    .sort({ startsAt: 1 })
    .limit(10);
}

module.exports = {
  create,
  findById,
  findByIdPopulated,
  findForEmployerInRange,
  findForApplicantInRange,
  updateById,
  deleteById,
  findOverlaps,
};

