import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function ApplicationNotes({
  applicationId,
  defaultOpen = false,
  alwaysOpen = false,
  title = "Internal Evaluation Note",
  subtitle = "Applicant review",
}) {
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(Boolean(alwaysOpen || defaultOpen));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState("");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get(`/applications/${applicationId}/notes`);
      setNotes(data.notes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // If parent swaps applicationId, refresh notes panel when opened.
    if (open && applicationId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, applicationId]);

  useEffect(() => {
    if (alwaysOpen) setOpen(true);
  }, [alwaysOpen]);

  const resetForm = () => {
    setText("");
    setRating("");
    setTags("");
    setEditingId(null);
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setText(note.text || "");
    setRating(note.rating ? String(note.rating) : "");
    setTags((note.tags || []).join(", "));
  };

  const submit = async () => {
    setError("");
    if (!text.trim()) {
      setError("Note text is required.");
      return;
    }

    const payload = {
      text: text.trim(),
      rating: rating ? Number(rating) : null,
      tags,
    };

    try {
      if (editingId) {
        await api.patch(`/application-notes/${editingId}`, payload);
      } else {
        await api.post(`/applications/${applicationId}/notes`, payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save note.");
    }
  };

  const remove = async (noteId) => {
    setError("");
    try {
      await api.delete(`/application-notes/${noteId}`);
      if (editingId === noteId) resetForm();
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete note.");
    }
  };

  return (
    <div>
      {!alwaysOpen && (
        <button className="btn secondary-btn small-btn" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide Notes" : `Notes (${notes.length})`}
        </button>
      )}

      {open && (
        <div className={alwaysOpen ? "dash-panel note-panel" : "card note-panel"} style={{ marginTop: 10 }}>
          <div className="dash-panel-head">
            <div>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p className="dash-muted" style={{ marginTop: 4 }}>
                {subtitle}
              </p>
            </div>
          </div>
          {error ? <p className="error">{error}</p> : null}
          {loading ? <p className="dash-muted">Loading notes...</p> : null}

          <div className="form" style={{ marginTop: 0 }}>
            <textarea
              rows={3}
              placeholder="Write an internal evaluation note..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="row" style={{ gap: 8, marginTop: 0 }}>
              <input
                style={{ maxWidth: 120 }}
                placeholder="Rating (1-5)"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
              <input
                placeholder="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn small-btn" type="button" onClick={submit}>
                {editingId ? "Update Note" : "Add Note"}
              </button>
              {editingId && (
                <button className="btn secondary-btn small-btn" type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            {notes.length === 0 ? (
              <p className="dash-muted">No notes yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n._id} className="card note-item" style={{ marginTop: 8 }}>
                  <p style={{ whiteSpace: "pre-wrap" }}>{n.text}</p>
                  <p className="dash-muted" style={{ marginTop: 6 }}>
                    {n.rating ? `Rating: ${n.rating} / 5` : "Rating: -"}{" "}
                    {n.tags?.length ? ` | Tags: ${n.tags.join(", ")}` : ""}
                  </p>
                  <p className="dash-muted">
                    {n.employer?.name ? `By ${n.employer.name}` : "By employer"}{" "}
                    {n.createdAt ? `• ${new Date(n.createdAt).toLocaleString()}` : ""}
                  </p>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn secondary-btn small-btn" type="button" onClick={() => startEdit(n)}>
                      Edit
                    </button>
                    <button className="btn danger small-btn" type="button" onClick={() => remove(n._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

