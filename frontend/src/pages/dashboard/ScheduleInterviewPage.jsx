import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import InterviewCalendar from "../../components/dashboard/InterviewCalendar";

export default function ScheduleInterviewPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedYmd, setSelectedYmd] = useState("");
  const [monthAnchorUtc, setMonthAnchorUtc] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  });
  const [form, setForm] = useState({
    date: "",
    time: "",
    durationMinutes: "30",
    meetingLink: "",
    location: "Online",
    notes: "",
  });
  const [editingInterviewId, setEditingInterviewId] = useState(null);

  const upcomingInterviews = useMemo(() => {
    return [...interviews].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [interviews]);

  const selectedDateInterviews = useMemo(() => {
    if (!selectedYmd) return [];
    return upcomingInterviews.filter((item) => {
      const d = new Date(item.startsAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}` === selectedYmd;
    });
  }, [selectedYmd, upcomingInterviews]);

  const loadPageData = async () => {
    setLoading(true);
    setError("");
    try {
      const [appRes, interviewRes] = await Promise.all([
        api.get(`/applications/${applicationId}`),
        api.get(`/interviews?applicationId=${applicationId}`),
      ]);
      setApplication(appRes.data.application || null);
      setInterviews(interviewRes.data.interviews || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load interview scheduler.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const onCalendarDateSelect = (ymd) => {
    setSelectedYmd(ymd);
    setForm((prev) => ({ ...prev, date: ymd }));
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.date || !form.time) {
      setError("Please select date and time for the interview.");
      return;
    }

    const startsAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      setError("Invalid interview date/time.");
      return;
    }

    const duration = Number(form.durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Duration must be greater than 0 minutes.");
      return;
    }

    const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);
    setSaving(true);

    try {
      const payload = {
        applicationId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        meetingLink: form.meetingLink.trim(),
        location: form.location.trim(),
        notes: form.notes.trim(),
      };

      const { data } = editingInterviewId
        ? await api.patch(`/interviews/${editingInterviewId}`, payload)
        : await api.post("/interviews", payload);
      setMessage(data.message || (editingInterviewId ? "Interview updated." : "Interview scheduled."));
      setForm((prev) => ({ ...prev, time: "", notes: "" }));
      setEditingInterviewId(null);
      await loadPageData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule interview.");
    } finally {
      setSaving(false);
    }
  };

  const downloadIcs = async (interviewId) => {
    try {
      const response = await api.get(`/interviews/${interviewId}/ics`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/calendar;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `interview-${interviewId}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download interview invite.");
    }
  };

  const startEditInterview = (item) => {
    const start = new Date(item.startsAt);
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    const hh = String(start.getHours()).padStart(2, "0");
    const mm = String(start.getMinutes()).padStart(2, "0");
    const ymd = `${y}-${m}-${d}`;

    setEditingInterviewId(item._id);
    setSelectedYmd(ymd);
    setForm({
      date: ymd,
      time: `${hh}:${mm}`,
      durationMinutes: String(Math.max(15, Math.round((new Date(item.endsAt) - start) / 60000))),
      meetingLink: item.meetingLink || "",
      location: item.location || "Online",
      notes: item.notes || "",
    });
    setMessage("");
    setError("");
  };

  const cancelEdit = () => {
    setEditingInterviewId(null);
    setForm({
      date: selectedYmd || "",
      time: "",
      durationMinutes: "30",
      meetingLink: "",
      location: "Online",
      notes: "",
    });
  };

  const deleteInterview = async (interviewId) => {
    const ok = window.confirm("Delete this interview schedule?");
    if (!ok) return;
    setError("");
    setMessage("");
    try {
      const { data } = await api.delete(`/interviews/${interviewId}`);
      setMessage(data.message || "Interview deleted.");
      if (editingInterviewId === interviewId) {
        cancelEdit();
      }
      await loadPageData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete interview.");
    }
  };

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <h2>Schedule Interview</h2>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {message ? <p style={{ color: "#065f46", marginTop: "0.5rem" }}>{message}</p> : null}

      {loading ? (
        <p className="dash-muted">Loading...</p>
      ) : !application ? (
        <p className="dash-muted">Application not found.</p>
      ) : (
        <>
          <div className="card">
            <p>
              <strong>Job:</strong> {application.job?.title || "-"}
            </p>
            <p>
              <strong>Candidate:</strong> {application.fullName || application.applicant?.name || "-"}
            </p>
            <p>
              <strong>Email:</strong> {application.email || application.applicant?.email || "-"}
            </p>
            <p>
              <strong>Status:</strong> {application.status}
            </p>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <InterviewCalendar
              events={upcomingInterviews}
              selectedYmd={selectedYmd}
              onSelectedYmdChange={onCalendarDateSelect}
              monthAnchorUtc={monthAnchorUtc}
              onMonthChange={setMonthAnchorUtc}
              disablePastDays
            />
          </div>

          <form onSubmit={submitSchedule} className="dash-form-grid" style={{ marginTop: "1rem" }}>
            <label>
              Interview Date
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setSelectedYmd(e.target.value);
                  setForm((prev) => ({ ...prev, date: e.target.value }));
                }}
                required
              />
            </label>

            <label>
              Interview Time
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                required
              />
            </label>

            <label>
              Duration (minutes)
              <input
                type="number"
                min="15"
                step="15"
                value={form.durationMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                required
              />
            </label>

            <label>
              Meeting Link
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={form.meetingLink}
                onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
              />
            </label>

            <label>
              Location
              <input
                type="text"
                placeholder="Online / Office address"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </label>

            <label className="span-2">
              Notes
              <textarea
                rows={3}
                placeholder="Optional notes for candidate"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </label>

            <div className="span-2 row" style={{ justifyContent: "flex-end", marginTop: 0 }}>
              {editingInterviewId ? (
                <button className="btn secondary-btn" type="button" onClick={cancelEdit}>
                  Cancel Edit
                </button>
              ) : null}
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingInterviewId ? "Update Interview" : "Schedule Interview"}
              </button>
            </div>
          </form>

          <div className="dash-panel" style={{ marginTop: "1rem", padding: "0.9rem" }}>
            <div className="dash-panel-head">
              <h3 style={{ margin: 0 }}>Selected Day Interviews</h3>
            </div>
            {!selectedYmd ? (
              <p className="dash-muted">Select a day on the calendar to view interview slots.</p>
            ) : selectedDateInterviews.length === 0 ? (
              <p className="dash-muted">No interviews scheduled for {selectedYmd}.</p>
            ) : (
              <div className="dash-list">
                {selectedDateInterviews.map((it) => (
                  <div key={it._id} className="dash-list-item" style={{ gridTemplateColumns: "1fr auto" }}>
                    <div>
                      <div className="dash-list-title">
                        {new Date(it.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(it.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="dash-muted">{it.location || it.meetingLink || "No location provided"}</div>
                    </div>
                    <div className="row" style={{ marginTop: 0, gap: 8 }}>
                      <button
                        className="btn secondary-btn small-btn"
                        type="button"
                        onClick={() => startEditInterview(it)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn secondary-btn small-btn"
                        type="button"
                        onClick={() => downloadIcs(it._id)}
                      >
                        Download ICS
                      </button>
                      <button
                        className="btn danger small-btn"
                        type="button"
                        onClick={() => deleteInterview(it._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

