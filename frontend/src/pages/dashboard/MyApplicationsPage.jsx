import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");

  const serverBase = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    try {
      return new URL(apiBase).origin;
    } catch {
      return "http://localhost:5000";
    }
  }, []);

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const { data } = await api.get("/applications/my-applications");
        setApplications(data.applications || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applications.");
      }
    }
    load();
  }, []);

  const resumeHref = (resume) => {
    if (!resume) return "";
    if (resume.startsWith("http")) return resume;
    return `${serverBase}${resume}`;
  };

  const overview = useMemo(() => {
    const total = applications.length;
    const shortlisted = applications.filter((app) => app.status === "shortlisted").length;
    const pending = applications.filter((app) => app.status === "pending").length;
    const rejected = applications.filter((app) => app.status === "rejected").length;

    return { total, shortlisted, pending, rejected };
  }, [applications]);

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <h2>My Applications</h2>
      </div>
      {error ? <p className="error">{error}</p> : null}

      {applications.length === 0 ? (
        <p className="dash-muted">You have not applied to any jobs yet.</p>
      ) : (
        <div className="applications-layout">
          <div className="applications-stats">
            <article className="applications-stat-card">
              <p className="applications-stat-label">Total Applications</p>
              <p className="applications-stat-value">{overview.total}</p>
            </article>
            <article className="applications-stat-card">
              <p className="applications-stat-label">Shortlisted</p>
              <p className="applications-stat-value">{overview.shortlisted}</p>
            </article>
            <article className="applications-stat-card">
              <p className="applications-stat-label">Pending</p>
              <p className="applications-stat-value">{overview.pending}</p>
            </article>
            <article className="applications-stat-card">
              <p className="applications-stat-label">Rejected</p>
              <p className="applications-stat-value">{overview.rejected}</p>
            </article>
          </div>

          <section className="dash-panel applications-inner-panel">
            <div className="dash-panel-head">
              <h3>Application History</h3>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>Resume</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td>{app.job?.title || "-"}</td>
                      <td>
                        <span className="app-status-chip">{app.status || "-"}</span>
                      </td>
                      <td>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        {app.resume ? (
                          <a href={resumeHref(app.resume)} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

