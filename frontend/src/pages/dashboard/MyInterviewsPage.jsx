import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import InterviewCalendar from "../../components/dashboard/InterviewCalendar";

export default function MyInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYmd, setSelectedYmd] = useState("");
  const [monthAnchorUtc, setMonthAnchorUtc] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  });

  const sorted = useMemo(() => {
    return [...interviews].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [interviews]);

  const selectedDayItems = useMemo(() => {
    if (!selectedYmd) return [];
    return sorted.filter((item) => {
      const d = new Date(item.startsAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}` === selectedYmd;
    });
  }, [selectedYmd, sorted]);

  const loadInterviews = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/interviews");
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

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
      setError(err.response?.data?.message || "Failed to download invite.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h1 className="dash-title" style={{ marginBottom: 6 }}>
          My Interviews
        </h1>
        <p className="dash-muted">View interview schedules shared by employers.</p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="dash-muted">Loading interviews...</p>
      ) : (
        <>
          <InterviewCalendar
            events={sorted}
            selectedYmd={selectedYmd}
            onSelectedYmdChange={setSelectedYmd}
            monthAnchorUtc={monthAnchorUtc}
            onMonthChange={setMonthAnchorUtc}
          />

          <div className="dash-panel" style={{ marginTop: "1rem" }}>
            <div className="dash-panel-head">
              <h3 style={{ margin: 0 }}>Interview Details</h3>
            </div>
            {!selectedYmd ? (
              <p className="dash-muted">Select a day to see interviews.</p>
            ) : selectedDayItems.length === 0 ? (
              <p className="dash-muted">No interviews on {selectedYmd}.</p>
            ) : (
              <div className="dash-list">
                {selectedDayItems.map((it) => (
                  <div key={it._id} className="dash-list-item" style={{ gridTemplateColumns: "1fr auto" }}>
                    <div>
                      <div className="dash-list-title">
                        {it.job?.title || "Interview"} -{" "}
                        {new Date(it.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to{" "}
                        {new Date(it.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="dash-muted">{it.employer?.companyName || it.employer?.name || "Employer"}</div>
                      <div className="dash-muted">{it.location || it.meetingLink || "No location provided"}</div>
                    </div>
                    <button className="btn secondary-btn small-btn" type="button" onClick={() => downloadIcs(it._id)}>
                      Download ICS
                    </button>
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
