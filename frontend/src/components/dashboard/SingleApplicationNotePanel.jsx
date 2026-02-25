import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

function toPreview(text) {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t.length > 70 ? `${t.slice(0, 70)}...` : t;
}

export default function SingleApplicationNotePanel({
  applicationId,
  onClose,
  onNoteChange,
  title = "Internal Evaluation Note",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [noteId, setNoteId] = useState(null);
  const [existing, setExisting] = useState(null);
  const [editing, setEditing] = useState(false);

  const [text, setText] = useState("");
  const [rating, setRating] = useState("");
  const [tags, setTags] = useState("");

  const hasNote = Boolean(noteId);

  const summary = useMemo(() => {
    if (!existing) return { preview: "", rating: null };
    return { preview: toPreview(existing.text), rating: existing.rating ?? null };
  }, [existing]);

  const resetFormFromExisting = () => {
    setText(existing?.text || "");
    setRating(existing?.rating ? String(existing.rating) : "");
    setTags((existing?.tags || []).join(", "));
  };

  async function load() {
    if (!applicationId) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get(`/applications/${applicationId}/notes`);
      const first = (data.notes || [])[0] || null;
      setExisting(first);
      setNoteId(first?._id || null);
      setEditing(false);
      setText("");
      setRating("");
      setTags("");

      onNoteChange?.(applicationId, first ? { preview: toPreview(first.text), rating: first.rating ?? null } : null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load note.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const startAdd = () => {
    setEditing(true);
    setText("");
    setRating("");
    setTags("");
  };

  const startEdit = () => {
    setEditing(true);
    resetFormFromExisting();
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
    setText("");
    setRating("");
    setTags("");
  };

  const save = async () => {
    setError("");
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Note text is required.");
      return;
    }

    const payload = {
      text: trimmed,
      rating: rating ? Number(rating) : null,
      tags,
    };

    try {
      if (hasNote) {
        const { data } = await api.patch(`/application-notes/${noteId}`, payload);
        setExisting(data.note);
        setEditing(false);
        onNoteChange?.(applicationId, {
          preview: toPreview(data.note?.text),
          rating: data.note?.rating ?? null,
        });
      } else {
        const { data } = await api.post(`/applications/${applicationId}/notes`, payload);
        setExisting(data.note);
        setNoteId(data.note?._id || null);
        setEditing(false);
        onNoteChange?.(applicationId, {
          preview: toPreview(data.note?.text),
          rating: data.note?.rating ?? null,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save note.";
      setError(msg);
    }
  };

  const remove = async () => {
    setError("");
    if (!noteId) return;
    try {
      await api.delete(`/application-notes/${noteId}`);
      setExisting(null);
      setNoteId(null);
      setEditing(false);
      onNoteChange?.(applicationId, null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete note.");
    }
  };

  return (
    <div className="dash-panel note-panel" style={{ marginTop: 16 }}>
      <div className="dash-panel-head">
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p className="dash-muted" style={{ marginTop: 4 }}>
            Applicant review (internal only)
          </p>
        </div>
        <button className="btn secondary-btn small-btn" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="dash-muted">Loading...</p> : null}

      {!editing && (
        <div className="card note-item" style={{ boxShadow: "none" }}>
          {existing ? (
            <>
              <p style={{ whiteSpace: "pre-wrap" }}>{existing.text}</p>
              <p className="dash-muted" style={{ marginTop: 6 }}>
                {existing.rating ? `Rating: ${existing.rating} / 5` : "Rating: -"}{" "}
                {existing.tags?.length ? ` | Tags: ${existing.tags.join(", ")}` : ""}
              </p>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn secondary-btn small-btn" type="button" onClick={startEdit}>
                  Update Note
                </button>
                <button className="btn danger small-btn" type="button" onClick={remove}>
                  Delete
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="dash-muted">No note yet.</p>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn small-btn" type="button" onClick={startAdd}>
                  Add Note
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {editing && (
        <div className="form" style={{ marginTop: 0 }}>
          <textarea
            rows={3}
            placeholder="Write an internal evaluation note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row" style={{ gap: 8, marginTop: 0 }}>
            <input
              style={{ maxWidth: 140 }}
              placeholder="Rating (1-5)"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
            <input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn small-btn" type="button" onClick={save}>
              Save
            </button>
            <button className="btn secondary-btn small-btn" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expose small summary for parent if needed */}
      <span style={{ display: "none" }} aria-hidden="true">
        {summary.preview}
      </span>
    </div>
  );
}

