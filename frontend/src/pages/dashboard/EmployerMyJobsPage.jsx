import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function EmployerMyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const { data } = await api.get("/jobs/my-jobs");
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your jobs.");
      }
    }
    load();
  }, []);

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <h2>My Jobs</h2>
        <Link className="dash-link-inline" to="/post-job">
          Post a job →
        </Link>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {jobs.length === 0 ? (
        <p className="dash-muted">No jobs posted yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Type</th>
                <th>Posted</th>
                <th>Applications</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td>{job.title}</td>
                  <td>{job.location}</td>
                  <td>{job.employmentType}</td>
                  <td>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <Link to={`/dashboard/job/${job._id}/applications`}>View applicants</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

