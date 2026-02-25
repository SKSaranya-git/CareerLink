import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

export default function ScheduleInterviewPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");

  // Placeholder until Interview Scheduler System is implemented.
  useEffect(() => {
    async function load() {
      setError("");
      try {
        // We don't have a dedicated "get application by id" endpoint yet.
        // For now, load from shortlisted list and find the item.
        const { data } = await api.get("/applications/shortlisted");
        const found = (data.applications || []).find((a) => a._id === applicationId);
        setApplication(found || null);
        if (!found) setError("Application not found in shortlisted list.");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load application.");
      }
    }
    if (applicationId) load();
  }, [applicationId]);

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <h2>Schedule Interview</h2>
      </div>
      {error ? <p className="error">{error}</p> : null}

      {!application ? (
        <p className="dash-muted">Loading...</p>
      ) : (
        <div className="card">
          <p className="dash-muted">
            Interview Scheduler System will be integrated next. This page confirms the shortlisted candidate and job.
          </p>
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
          <p className="dash-muted">Next step: add date/time, meeting link, and send invite email.</p>
        </div>
      )}
    </div>
  );
}

