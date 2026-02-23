import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import SingleApplicationNotePanel from "../../components/dashboard/SingleApplicationNotePanel";

export default function EmployerShortlistedPage() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
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

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const { data } = await api.get("/applications/shortlisted");
        const apps = data.applications || [];
        setApplications(apps);
        setSelectedId((prev) => prev || apps[0]?._id || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load shortlisted applicants.");
      }
    }
    load();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h1 className="dash-title" style={{ marginBottom: 6 }}>
          Shortlisted for Interview
        </h1>
        <p className="dash-muted">Manage candidates that have been moved to the interview phase.</p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {applications.length === 0 ? (
        <p className="dash-muted">No shortlisted candidates yet.</p>
      ) : (
        <>
          <div className="dash-panel" style={{ marginTop: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Resume</th>
                    <th>Applied</th>
                    <th>Schedule</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app._id}
                      className={selectedId === app._id ? "table-row-selected" : ""}
                      onClick={() => setSelectedId(app._id)}
                      style={{ cursor: "pointer" }}
                      title="Select applicant to review"
                    >
                      <td>{app.job?.title || "-"}</td>
                      <td>{app.fullName || app.applicant?.name || "-"}</td>
                      <td>{app.email || app.applicant?.email || "-"}</td>
                      <td>{app.phone || app.applicant?.contactNumber || "-"}</td>
                      <td>
                        {app.resume ? (
                          <a
                            href={resumeHref(app.resume)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        <Link
                          className="btn schedule-btn"
                          to={`/dashboard/schedule-interview/${app._id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Schedule Interview
                        </Link>
                      </td>
                      <td>
                        <div style={{ display: "grid", gap: 6 }}>
                          <button
                            className="btn secondary-btn small-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(app._id);
                              setNotePanelForId(app._id);
                            }}
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
          </div>

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
        </>
      )}
    </div>
  );
}

