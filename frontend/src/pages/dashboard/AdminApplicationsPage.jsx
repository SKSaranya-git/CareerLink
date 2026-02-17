import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/applications")
      .then((res) => setApplications(res.data.applications || []))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load applications"));
  }, []);

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <h2>Applications</h2>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Applicant</th>
              <th>Email</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app._id}>
                <td>{app.job?.title || "-"}</td>
                <td>{app.applicant?.name || "-"}</td>
                <td>{app.applicant?.email || "-"}</td>
                <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

