const Application = require("./application.model");

async function findById(applicationId) {
  return Application.findById(applicationId);
}

async function findByIdPopulated(applicationId) {
  return Application.findById(applicationId)
    .populate("job", "title employer")
    .populate("applicant", "name email contactNumber");
}

async function findOneByJobAndApplicant(jobId, applicantId) {
  return Application.findOne({ job: jobId, applicant: applicantId });
}

async function create(applicationData) {
  return Application.create(applicationData);
}

async function findByApplicant(applicantId) {
  return Application.find({ applicant: applicantId })
    .populate("job", "title location employmentType salary employer")
    .sort({ appliedAt: -1 });
}

async function findByJob(jobId) {
  return Application.find({ job: jobId })
    .populate("applicant", "name email contactNumber skills")
    .sort({ appliedAt: -1 });
}

async function findAll() {
  return Application.find()
    .populate("job", "title location employer")
    .populate("applicant", "name email role")
    .sort({ appliedAt: -1 });
}

async function findByJobIdsAndStatus(jobIds, status) {
  return Application.find({ job: { $in: jobIds }, status })
    .populate("job", "title location employmentType salary employer")
    .populate("applicant", "name email contactNumber skills")
    .sort({ appliedAt: -1 });
}

async function updateStatus(applicationId, status) {
  // `updatedAt` is handled by schema timestamps.
  return Application.findByIdAndUpdate(
    applicationId,
    { $set: { status } },
    { new: true, runValidators: true }
  )
    .populate("job", "title employer")
    .populate("applicant", "name email contactNumber");
}

async function deleteById(applicationId) {
  return Application.findByIdAndDelete(applicationId);
}

module.exports = {
  findById,
  findByIdPopulated,
  findOneByJobAndApplicant,
  create,
  findByApplicant,
  findByJob,
  findAll,
  findByJobIdsAndStatus,
  updateStatus,
  deleteById,
};

