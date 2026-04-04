import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import InterviewCalendar from "../../components/dashboard/InterviewCalendar";

function startOfMonthUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

function endOfMonthUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0));
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ymdFromLocalDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toInputTime(date) {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildLocalIso(ymd, time) {
  // ymd: "YYYY-MM-DD", time: "HH:mm" (local time)
  const d = new Date(`${ymd}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function currentTimeHHmm() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toInitials(name) {
  const safe = (name || "").trim();
  if (!safe) return "C";
  const parts = safe.split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function ScheduleInterviewPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);

  const [monthAnchorUtc, setMonthAnchorUtc] = useState(() => startOfMonthUTC(new Date()));
  const [selectedYmd, setSelectedYmd] = useState(() => todayYmd());

  const [monthInterviews, setMonthInterviews] = useState([]);
  const [appInterviews, setAppInterviews] = useState([]);

  const [editingId, setEditingId] = useState("");
  const [startsTime, setStartsTime] = useState("10:00");
  const [endsTime, setEndsTime] = useState("10:30");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("Online");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const minSelectableYmd = todayYmd();
  const startMinTime = selectedYmd === minSelectableYmd ? currentTimeHHmm() : undefined;

  const monthRange = useMemo(() => {
    const from = startOfMonthUTC(monthAnchorUtc);
    const to = endOfMonthUTC(monthAnchorUtc);
    return { from, to };
  }, [monthAnchorUtc]);

  const calendarEvents = useMemo(() => {
    return (monthInterviews || []).map((i) => {
      const jobTitle = i.job?.title || "Job";
      const applicantName = i.applicant?.name || "Candidate";
      const isThisApp = i.application?.toString?.() === applicationId || i.application?._id === applicationId || i.application === applicationId;
      return {
        ...i,
        title: isThisApp ? `${jobTitle} - ${applicantName} (this candidate)` : `${jobTitle} - ${applicantName}`,
      };
    });
  }, [monthInterviews, applicationId]);

  async function loadApplication() {
    const { data } = await api.get(`/applications/${applicationId}`);
    setApplication(data.application || null);
  }

  async function loadMonthInterviews() {
    const { data } = await api.get("/interviews", {
      params: { from: monthRange.from.toISOString(), to: monthRange.to.toISOString() },
    });
    setMonthInterviews(data.interviews || []);
  }

  async function loadApplicationInterviews() {
    const { data } = await api.get("/interviews", {
      params: { applicationId },
    });
    setAppInterviews(data.interviews || []);
  }

  async function loadAll() {
    setError("");
    setMessage("");
    try {
      await Promise.all([loadApplication(), loadMonthInterviews(), loadApplicationInterviews()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load scheduling data.");
    }
  }

  useEffect(() => {
    if (applicationId) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, monthRange.from.getTime(), monthRange.to.getTime()]);

  const resetForm = () => {
    setEditingId("");
    setStartsTime("10:00");
    setEndsTime("10:30");
    setMeetingLink("");
    setLocation("Online");
    setNotes("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const startsAt = buildLocalIso(selectedYmd, startsTime);
    const endsAt = buildLocalIso(selectedYmd, endsTime);
    if (!startsAt || !endsAt) {
      setSaving(false);
      setError("Please select a valid date and time.");
      return;
    }
    if (new Date(startsAt) < new Date()) {
      setSaving(false);
      setError("Start time must be current or future.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setSaving(false);
      setError("End time must be after start time.");
      return;
    }

    try {
      if (editingId) {
        const { data } = await api.patch(`/interviews/${editingId}`, {
          startsAt,
          endsAt,
          timezone,
          meetingLink,
          location,
          notes,
          status: "scheduled",
        });
        setMessage(data.message || "Interview updated.");
      } else {
        const { data } = await api.post("/interviews", {
          applicationId,
          startsAt,
          endsAt,
          timezone,
          meetingLink,
          location,
          notes,
        });
        setMessage(data.message || "Interview scheduled.");
      }

      await Promise.all([loadMonthInterviews(), loadApplicationInterviews()]);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save interview schedule.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (i) => {
    setEditingId(i._id);
    setSelectedYmd(ymdFromLocalDate(i.startsAt));
    setStartsTime(toInputTime(i.startsAt));
    setEndsTime(toInputTime(i.endsAt));
    setTimezone(i.timezone || timezone);
    setMeetingLink(i.meetingLink || "");
    setLocation(i.location || "");
    setNotes(i.notes || "");
  };

  const onDelete = async (interviewId) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this interview schedule? This will also email the applicant (best-effort).");
    if (!ok) return;

    setError("");
    setMessage("");
    try {
      const { data } = await api.delete(`/interviews/${interviewId}`);
      setMessage(data.message || "Interview deleted.");
      await Promise.all([loadMonthInterviews(), loadApplicationInterviews()]);
      if (editingId === interviewId) resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete interview schedule.");
    }
  };

  const candidateName = application?.fullName || application?.applicant?.name || "-";
  const candidateEmail = application?.email || application?.applicant?.email || "-";
  const candidatePhone = application?.phone || application?.applicant?.contactNumber || "-";
  const candidateLocation = application?.location || application?.applicant?.location || "";
  const portfolioHref = application?.applicant?.portfolioUrl || application?.resume || "";

  return (
    <div className="dash-panel schedule-shell">
      <div className="dash-panel-head">
        <h2>Interview Scheduler</h2>
      </div>
      <p className="dash-muted">Pick a day, choose the time, then schedule. Past date/time is blocked automatically.</p>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!application ? (
        <p className="dash-muted">Loading...</p>
      ) : (
        <>
          <div className="schedule-candidate-card">
            <div className="schedule-candidate-main">
              <div className="schedule-candidate-avatar">{toInitials(candidateName)}</div>
              <div>
                <div className="schedule-candidate-headline">
                  <h3 className="schedule-candidate-name">{candidateName}</h3>
                  <span className="schedule-shortlisted-pill">Shortlisted</span>
                </div>
                <p className="schedule-candidate-role">{application.job?.title || "-"}</p>
                <p className="dash-muted schedule-candidate-meta">
                  {candidateEmail}
                  {candidateLocation ? ` • ${candidateLocation}` : ""}
                  {candidatePhone && candidatePhone !== "-" ? ` • ${candidatePhone}` : ""}
                </p>
              </div>
            </div>
            <div className="schedule-candidate-actions">
              {portfolioHref ? (
                <a className="btn secondary-btn small-btn" href={portfolioHref} target="_blank" rel="noreferrer">
                  View Portfolio
                </a>
              ) : (
                <button className="btn secondary-btn small-btn" type="button" disabled>
                  View Portfolio
                </button>
              )}
              <p className="dash-muted">Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "-"}</p>
            </div>
          </div>

          <div className="schedule-layout">
            <div className="dash-panel schedule-card schedule-calendar-card">
              <div className="dash-panel-head">
                <div>
                  <h3 className="schedule-step-title">Pick date from calendar</h3>
                  <p className="dash-muted">Select an available slot for the interview</p>
                </div>
                <div className="schedule-view-toggle">
                  <button className="btn secondary-btn small-btn" type="button">
                    Month
                  </button>
                  <button className="btn secondary-btn small-btn" type="button" disabled>
                    Week
                  </button>
                </div>
              </div>
              <InterviewCalendar
                events={calendarEvents}
                selectedYmd={selectedYmd}
                onSelectedYmdChange={setSelectedYmd}
                monthAnchorUtc={monthAnchorUtc}
                onMonthChange={setMonthAnchorUtc}
                disablePastDays
              />
            </div>

            <div className="dash-panel schedule-card schedule-form-card">
              <div className="dash-panel-head">
                <div>
                  <h3 className="schedule-step-title">
                    {editingId ? "Edit interview details" : "Enter interview details"}
                  </h3>
                  <p className="dash-muted">Review parameters before sending invitation</p>
                </div>
                {editingId ? (
                  <button className="btn secondary-btn small-btn" type="button" onClick={resetForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <div className="schedule-form-hero" aria-hidden="true" />

              <form className="dash-form-grid schedule-details-grid" onSubmit={onSubmit}>
                <label>
                  Interview date
                  <input
                    type="date"
                    min={minSelectableYmd}
                    value={selectedYmd}
                    onChange={(e) => setSelectedYmd(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Timezone
                  <input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                  />
                </label>
                <label>
                  Start time
                  <input
                    type="time"
                    min={startMinTime}
                    value={startsTime}
                    onChange={(e) => setStartsTime(e.target.value)}
                    required
                  />
                </label>
                <label>
                  End time
                  <input type="time" value={endsTime} onChange={(e) => setEndsTime(e.target.value)} required />
                </label>
                <label className="span-2">
                  Meeting link (optional)
                  <input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://..." />
                </label>
                <label className="span-2">
                  Location (optional)
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Online / Office address..." />
                </label>
                <label className="span-2">
                  Internal notes (optional)
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any instructions..." />
                </label>

                <div className="span-2 row schedule-form-actions">
                  <button className="btn schedule-submit-btn" disabled={saving} type="submit">
                    {saving ? "Saving..." : editingId ? "Update & email applicant" : "Schedule & email applicant"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="dash-panel schedule-card schedule-history-card">
            <div className="dash-panel-head">
              <div>
                <h3 className="schedule-step-title">Scheduled interviews for this candidate</h3>
                <p className="dash-muted schedule-history-copy">Manage planned sessions, edits, and cancellations.</p>
              </div>
            </div>

            {appInterviews.length === 0 ? (
              <p className="dash-muted">No interviews scheduled yet for this application.</p>
            ) : (
              <div className="table-wrap schedule-history-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Meeting</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appInterviews.map((i) => (
                      <tr key={i._id}>
                        <td>
                          {new Date(i.startsAt).toLocaleString()} - {new Date(i.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          <div className="dash-muted">{i.timezone || "UTC"}</div>
                        </td>
                        <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                          {i.meetingLink ? (
                            <a href={i.meetingLink} target="_blank" rel="noreferrer">
                              Open link
                            </a>
                          ) : (
                            <span className="dash-muted">-</span>
                          )}
                          {i.location ? <div className="dash-muted">{i.location}</div> : null}
                        </td>
                        <td>
                          <span className="app-status-chip">{i.status}</span>
                        </td>
                        <td>
                          <div className="app-action-controls">
                            <button className="btn secondary-btn small-btn" type="button" onClick={() => onEdit(i)}>
                              Edit
                            </button>
                            <button className="btn danger small-btn" type="button" onClick={() => onDelete(i._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

