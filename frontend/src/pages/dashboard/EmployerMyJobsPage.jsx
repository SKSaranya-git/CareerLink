import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import EditJobModal from "../../components/dashboard/EditJobModal";

export default function EmployerMyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [editingJob, setEditingJob] = useState(null);

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      alert("Failed to delete job.");
    }
  };

  const handleJobUpdated = (updatedJob) => {
    setJobs((prev) => prev.map((j) => (j._id === updatedJob._id ? updatedJob : j)));
  };

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
                <th>Actions</th>
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
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="small-btn"
                        style={{ background: "#e8efff", color: "#3854cc", border: "none", fontWeight: "600", cursor: "pointer", padding: "0.3rem 0.6rem", borderRadius: "4px" }}
                        onClick={() => setEditingJob(job)}
                      >
                        Edit
                      </button>
                      <button
                        className="small-btn"
                        style={{ background: "#fee2e2", color: "#dc2626", border: "none", fontWeight: "600", cursor: "pointer", padding: "0.3rem 0.6rem", borderRadius: "4px" }}
                        onClick={() => handleDelete(job._id)}
                      >
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

      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onUpdated={handleJobUpdated}
        />
      )}
    </div>
  );
}

