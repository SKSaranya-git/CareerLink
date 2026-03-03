const ApiError = require("../../utils/ApiError");
const { ROLES } = require("../../utils/constants");
const applicationRepository = require("../application/application.repository");
const applicationNoteRepository = require("./applicationNote.repository");

async function assertEmployerOwnsApplication({ applicationId, employerUser }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can manage application notes.");
  }

  const application = await applicationRepository.findByIdPopulated(applicationId);
  if (!application) throw new ApiError(404, "Application not found.");

  const jobEmployerId = application.job?.employer;
  if (!jobEmployerId || jobEmployerId.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "Not allowed to access notes for this application.");
  }

  return application;
}

async function createNote({ applicationId, employerUser, payload }) {
  await assertEmployerOwnsApplication({ applicationId, employerUser });

  // Normalize tags: allow ["a","b"] or "a,b"
  let tags = payload.tags;
  if (typeof tags === "string") {
    tags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(tags)) tags = [];

  const created = await applicationNoteRepository.create({
    application: applicationId,
    employer: employerUser._id,
    text: payload.text,
    rating: payload.rating ?? null,
    tags,
  });

  return created;
}

async function listNotes({ applicationId, employerUser }) {
  await assertEmployerOwnsApplication({ applicationId, employerUser });
  return applicationNoteRepository.findByApplication(applicationId);
}

async function getNoteById({ noteId, employerUser }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can view notes.");
  }

  const note = await applicationNoteRepository.findByIdPopulated(noteId);
  if (!note) throw new ApiError(404, "Note not found.");

  await assertEmployerOwnsApplication({ applicationId: note.application, employerUser });

  if (note.employer?._id?.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "You can view only your own notes.");
  }

  return note;
}

async function updateNote({ noteId, employerUser, payload }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can update notes.");
  }

  const note = await applicationNoteRepository.findById(noteId);
  if (!note) throw new ApiError(404, "Note not found.");

  // Ensure this employer is the owner of the application (job owner), and also the author of the note.
  await assertEmployerOwnsApplication({ applicationId: note.application, employerUser });

  if (note.employer.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "You can edit only your own notes.");
  }

  let tags = payload.tags;
  if (typeof tags === "string") {
    tags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (tags !== undefined && !Array.isArray(tags)) tags = [];

  const updated = await applicationNoteRepository.updateById(noteId, {
    ...(payload.text !== undefined ? { text: payload.text } : {}),
    ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
    ...(payload.tags !== undefined ? { tags } : {}),
  });

  return updated;
}

async function deleteNote({ noteId, employerUser }) {
  if (!employerUser || employerUser.role !== ROLES.EMPLOYER) {
    throw new ApiError(403, "Only employers can delete notes.");
  }

  const note = await applicationNoteRepository.findById(noteId);
  if (!note) throw new ApiError(404, "Note not found.");

  await assertEmployerOwnsApplication({ applicationId: note.application, employerUser });

  if (note.employer.toString() !== employerUser._id.toString()) {
    throw new ApiError(403, "You can delete only your own notes.");
  }

  await applicationNoteRepository.deleteById(noteId);
}

module.exports = {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote,
};

