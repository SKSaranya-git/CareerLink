const ApplicationNote = require("./applicationNote.model");

async function create(payload) {
  return ApplicationNote.create(payload);
}

async function findByApplication(applicationId) {
  return ApplicationNote.find({ application: applicationId })
    .populate("employer", "name email")
    .sort({ createdAt: -1 });
}

async function findById(noteId) {
  return ApplicationNote.findById(noteId);
}

async function findByIdPopulated(noteId) {
  return ApplicationNote.findById(noteId).populate("employer", "name email");
}

async function updateById(noteId, payload) {
  return ApplicationNote.findByIdAndUpdate(noteId, payload, {
    new: true,
    runValidators: true,
  }).populate("employer", "name email");
}

async function deleteById(noteId) {
  return ApplicationNote.findByIdAndDelete(noteId);
}

module.exports = {
  create,
  findByApplication,
  findById,
  findByIdPopulated,
  updateById,
  deleteById,
};

