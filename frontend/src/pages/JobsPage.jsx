import { useEffect, useState } from "react";
import api from "../api/axios";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { getMyApplications } from "../api/applicationApi";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const loadJobs = async () => {
    try {
      const { data } = await api.get(`/jobs${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setJobs(data.jobs);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyApplications = async () => {
    if (user && user.role === "job_seeker") {
      try {
        const data = await getMyApplications();
        const appMap = {};
        data.applications.forEach(app => {
          appMap[app.job._id] = app;
        });
        setMyApplications(appMap);
      } catch (err) {
        console.error("Failed to load applications", err);
      }
    }
  };

  useEffect(() => {
    loadJobs();
    loadMyApplications();
  }, [user]);

  const applyToJob = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        coverLetter: "I am excited to apply and contribute meaningful value.",
      });
      setMessage("Application submitted.");
      loadMyApplications(); // Refresh applications to update UI
    } catch (error) {
      setMessage(error.response?.data?.message || "Application failed.");
    }
  };

  return (
    <div className="container">
      <h1>Job Listings</h1>
      <div className="row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs" />
        <button className="btn" onClick={loadJobs}>
          Search
        </button>
      </div>
      {message && <p>{message}</p>}
      <div className="grid">
        {jobs.map((job) => (
          <JobCard
            key={job._id}
            job={job}
            canApply={user?.role === "job_seeker"}
            application={myApplications[job._id]}
            onApply={applyToJob}
          />
        ))}
      </div>
    </div>
  );
}
