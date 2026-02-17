import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/jobs")
      .then((res) => setJobs(res.data.jobs || []))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load jobs"));
  }, []);

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <h2>Job Listings</h2>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Employer</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id}>
                <td>{job.title}</td>
                <td>{job.company}</td>
                <td>{job.employer?.email || "-"}</td>
                <td>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

