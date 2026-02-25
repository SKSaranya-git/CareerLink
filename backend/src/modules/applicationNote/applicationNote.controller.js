const applicationNoteService = require("./applicationNote.service");

async function create(req, res, next) {
  try {
    const note = await applicationNoteService.createNote({
      applicationId: req.params.applicationId,
      employerUser: req.user,
      payload: req.body,
    });
    res.status(201).json({ message: "Note created.", note });
  } catch (err) {
    next(err);
  }
}

async function listByApplication(req, res, next) {
  try {
    const notes = await applicationNoteService.listNotes({
      applicationId: req.params.applicationId,
      employerUser: req.user,
    });
    res.status(200).json({ count: notes.length, notes });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const note = await applicationNoteService.updateNote({
      noteId: req.params.noteId,
      employerUser: req.user,
      payload: req.body,
    });
    res.status(200).json({ message: "Note updated.", note });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await applicationNoteService.deleteNote({
      noteId: req.params.noteId,
      employerUser: req.user,
    });
    res.status(200).json({ message: "Note deleted." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  listByApplication,
  update,
  remove,
};

