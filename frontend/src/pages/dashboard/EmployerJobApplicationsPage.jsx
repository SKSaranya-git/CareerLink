import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import SingleApplicationNotePanel from "../../components/dashboard/SingleApplicationNotePanel";

export default function EmployerJobApplicationsPage() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [notePanelForId, setNotePanelForId] = useState(null);
  const [noteSummaryByAppId, setNoteSummaryByAppId] = useState({});

  const serverBase = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    try {
      return new URL(apiBase).origin;
    } catch {
      return "http://localhost:5000";
    }
  }, []);

  const resumeHref = (resume) => {
    if (!resume) return "";
    if (resume.startsWith("http")) return resume;
    return `${serverBase}${resume}`;
  };

  async function load() {
    setError("");
    setMessage("");
    try {
      const { data } = await api.get(`/applications/job/${jobId}`);
      // This page shows only "pending" applications. Approved/rejected are handled elsewhere.
      setApplications((data.applications || []).filter((a) => a.status === "pending"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications.");
    }
  }

  useEffect(() => {
    if (jobId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const updateStatus = async (applicationId, status) => {
    setUpdatingId(applicationId);
    setMessage("");
    setError("");
    try {
      const { data } = await api.patch(`/applications/${applicationId}/status`, { status });
      setMessage(data.message || "Status updated.");
      // Remove from this list as soon as employer approves/rejects.
      setApplications((prev) => prev.filter((a) => a._id !== applicationId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h1 className="dash-title" style={{ marginBottom: 6 }}>Applicants</h1>
        <p className="dash-muted">Review and manage applications for this job.</p>
      </div>

      <div className="dash-panel" style={{ marginTop: 0 }}>
        {message ? <p>{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {applications.length === 0 ? (
          <p className="dash-muted">No applications yet for this job.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th>Cover Letter</th>
                  <th>Action</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id}>
                    <td>{app.fullName || app.applicant?.name || "-"}</td>
                    <td>{app.email || app.applicant?.email || "-"}</td>
                    <td>{app.phone || app.applicant?.contactNumber || "-"}</td>
                    <td>{app.status}</td>
                    <td>
                      {app.resume ? (
                        <a href={resumeHref(app.resume)} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{app.coverLetter || "-"}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <button
                          className="btn"
                          disabled={updatingId === app._id}
                          onClick={() => updateStatus(app._id, "shortlisted")}
                          title="Approve to interview (shortlist)"
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          className="btn danger"
                          disabled={updatingId === app._id}
                          onClick={() => updateStatus(app._id, "rejected")}
                          title="Reject applicant"
                          type="button"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 6 }}>
                        <button
                          className="btn secondary-btn small-btn"
                          type="button"
                          onClick={() => setNotePanelForId(app._id)}
                        >
                          {noteSummaryByAppId[app._id] ? "Edit Note" : "Add Note"}
                        </button>
                        {noteSummaryByAppId[app._id]?.preview ? (
                          <span className="dash-muted note-preview" title={noteSummaryByAppId[app._id].preview}>
                            {noteSummaryByAppId[app._id].preview}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {notePanelForId && (
          <SingleApplicationNotePanel
            applicationId={notePanelForId}
            onClose={() => setNotePanelForId(null)}
            onNoteChange={(appId, summary) =>
              setNoteSummaryByAppId((prev) => {
                const next = { ...prev };
                if (!summary) delete next[appId];
                else next[appId] = summary;
                return next;
              })
            }
          />
        )}
      </div>
    </div>
  );
}

