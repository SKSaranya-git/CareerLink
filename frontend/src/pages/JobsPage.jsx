import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [datePosted, setDatePosted] = useState("");

  // Selection
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Action State
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  // Apply Logic
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());
  const [applyForm, setApplyForm] = useState({
    isOpen: false,
    jobId: null,
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
    resumeFile: null,
    sendCopyToEmail: false,
    submitting: false,
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      // Load all pages so the default view always showcases every job in DB.
      const pageSize = 100;
      let currentPage = 1;
      let totalPages = 1;
      let allJobs = [];

      do {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(pageSize));

        const { data } = await api.get(`/jobs?${params.toString()}`);
        allJobs = [...allJobs, ...(data.jobs || [])];
        totalPages = data.totalPages || 1;
        currentPage += 1;
      } while (currentPage <= totalPages);

      setJobs(allJobs);
      setSelectedJobId((prevSelectedId) => {
        if (prevSelectedId && allJobs.some((job) => job._id === prevSelectedId)) {
          return prevSelectedId;
        }
        return allJobs[0]?._id || null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    async function loadApplied() {
      if (!user || user.role !== "job_seeker") return;
      try {
        const { data } = await api.get("/applications/my-applications");
        const ids = new Set((data.applications || []).map((a) => a.job?._id).filter(Boolean));
        setAppliedJobIds(ids);
      } catch {
        // non-blocking
      }
    }
    loadApplied();
  }, [user]);

  // Client-side filtering
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const searchableText = [
          job.title,
          job.description,
          job.responsibilities,
          job.requirements,
          job.location,
          job.employer?.companyName,
          job.employer?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      if (minSalary && job.salary < Number(minSalary)) return false;
      if (jobType) {
        if (Array.isArray(job.employmentType)) {
          if (!job.employmentType.includes(jobType)) return false;
        } else {
          if (job.employmentType !== jobType) return false;
        }
      }

      // Basic date matching (within X days)
      if (datePosted) {
        const postedDate = new Date(job.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - postedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (datePosted === "24h" && diffDays > 1) return false;
        if (datePosted === "7d" && diffDays > 7) return false;
        if (datePosted === "30d" && diffDays > 30) return false;
      }

      if (experienceLevel && job.experienceLevel) {
        if (job.experienceLevel !== experienceLevel) return false;
      }

      return true;
    });
  }, [jobs, search, minSalary, jobType, experienceLevel, datePosted]);

  const hasActiveFilters = Boolean(
    search.trim() || minSalary || jobType || experienceLevel || datePosted
  );
  const visibleJobs = hasActiveFilters ? filteredJobs : jobs;

  // Keep selected job in sync
  const selectedJob = useMemo(() => {
    return jobs.find(j => j._id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const openApply = (jobId) => {
    setMessage("");
    setApplyForm({
      isOpen: true,
      jobId,
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.contactNumber || "",
      coverLetter: "",
      resumeFile: null,
      sendCopyToEmail: false,
      submitting: false,
    });
  };

  const closeApply = () => {
    setApplyForm((prev) => ({ ...prev, isOpen: false, submitting: false }));
  };

  const submitApply = async (e) => {
    e.preventDefault();
    if (!applyForm.resumeFile) {
      setMessage("Please upload your resume (PDF/DOC/DOCX).");
      return;
    }

    setApplyForm((prev) => ({ ...prev, submitting: true }));

    const formData = new FormData();
    formData.append("fullName", applyForm.fullName);
    formData.append("email", applyForm.email);
    formData.append("phone", applyForm.phone);
    formData.append("coverLetter", applyForm.coverLetter);
    formData.append("resume", applyForm.resumeFile);
    formData.append("sendCopyToEmail", String(!!applyForm.sendCopyToEmail));

    try {
      const { data } = await api.post(`/applications/${applyForm.jobId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(data.message || "Application submitted.");
      setAppliedJobIds((prev) => new Set([...prev, applyForm.jobId]));
      closeApply();
    } catch (error) {
      const apiMsg = error.response?.data?.message;
      const firstValidationMsg = error.response?.data?.errors?.[0]?.msg;
      setMessage(firstValidationMsg || apiMsg || "Application failed.");
      setApplyForm((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Saved Jobs Logic
  const [savedJobIds, setSavedJobIds] = useState(() => new Set());

  useEffect(() => {
    async function loadSavedJobs() {
      if (!user || user.role !== "job_seeker") return;
      try {
        const { data } = await api.get("/users/saved-jobs");
        const ids = new Set((data.savedJobs || []).map((j) => j._id).filter(Boolean));
        setSavedJobIds(ids);
      } catch {
        // non-blocking
      }
    }
    loadSavedJobs();
  }, [user]);

  const toggleSaveJob = async (jobId) => {
    if (!user || user.role !== "job_seeker") return;
    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        await api.delete(`/users/saved-jobs/${jobId}`);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        setMessage("Job removed from saved.");
      } else {
        await api.post(`/users/saved-jobs/${jobId}`);
        setSavedJobIds((prev) => new Set([...prev, jobId]));
        setMessage("Job saved to your profile.");
      }
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to save job.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="jobs-page-container">
      <div className="jobs-filter-bar">
        <div className="jobs-filter-group" style={{ flexGrow: 1 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, keywords..."
            style={{ width: "100%" }}
          />
        </div>
        <div className="jobs-filter-group">
          <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="">Job Type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <div className="jobs-filter-group">
          <select value={minSalary} onChange={(e) => setMinSalary(e.target.value)}>
            <option value="">Pay (Minimum)</option>
            <option value="50000">LKR 50,000+</option>
            <option value="100000">LKR 100,000+</option>
            <option value="200000">LKR 200,000+</option>
          </select>
        </div>
        <div className="jobs-filter-group">
          <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
            <option value="">Experience Level</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
          </select>
        </div>
        <div className="jobs-filter-group">
          <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)}>
            <option value="">Date Posted</option>
            <option value="24h">Past 24 hours</option>
            <option value="7d">Past week</option>
            <option value="30d">Past month</option>
          </select>
        </div>
        <button className="btn" onClick={loadJobs}>Find Jobs</button>
      </div>

      {message && (
        <div style={{ padding: "1rem", background: "#ecfdf5", color: "#065f46", borderRadius: "8px", marginBottom: "1rem" }}>
          {message}
        </div>
      )}

      {loading ? (
        <p>Loading jobs...</p>
      ) : (
        <div className="jobs-layout">
          {/* LEFT PANE: List */}
          <div className="jobs-list-pane">
            {visibleJobs.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No jobs match your criteria.</p>
            ) : (
              <>
                {visibleJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    isActive={selectedJobId === job._id}
                    onClick={() => setSelectedJobId(job._id)}
                    canApply={user?.role === "job_seeker"}
                    isApplied={appliedJobIds.has(job._id)}
                    onApply={openApply}
                  />
                ))}

                <div style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>
                  Showing {visibleJobs.length} of {jobs.length} jobs
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANE: Details */}
          <div className="job-detail-pane">
            {selectedJob ? (
              <>
                <div className="job-detail-header">
                  <h2>{selectedJob.title}</h2>
                  <div className="job-detail-meta">
                    <strong>{selectedJob.employer?.companyName || selectedJob.employer?.name}</strong>
                    <span>•</span>
                    <span>{selectedJob.location}</span>
                    <span>•</span>
                    <span>Posted {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : "-"}</span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    {Array.isArray(selectedJob.employmentType) ? (
                      selectedJob.employmentType.map(type => (
                        <span key={type} className="dash-tag" style={{ background: "#f3f4f6", color: "#374151" }}>
                          {type.replace("-", " ")}
                        </span>
                      ))
                    ) : (
                      <span className="dash-tag" style={{ background: "#f3f4f6", color: "#374151" }}>
                        {selectedJob.employmentType}
                      </span>
                    )}
                    <span className="dash-tag" style={{ background: "#ecfdf5", color: "#065f46" }}>
                      LKR {selectedJob.salary}
                    </span>
                  </div>

                  <div className="job-detail-actions">
                    {user?.role === "job_seeker" ? (
                      appliedJobIds.has(selectedJob._id) ? (
                        <button className="btn" disabled title="You already applied to this job">
                          Applied ✓
                        </button>
                      ) : (
                        <button className="btn" onClick={() => openApply(selectedJob._id)} style={{ padding: "0.8rem 2rem" }}>
                          Apply Now
                        </button>
                      )
                    ) : (
                      <p className="dash-muted" style={{ margin: 0 }}>
                        Login as a job seeker to apply for this job.
                      </p>
                    )}
                    {user?.role === "job_seeker" && (
                      <button
                        className={`btn ${savedJobIds.has(selectedJob._id) ? "" : "secondary-btn"}`}
                        onClick={() => toggleSaveJob(selectedJob._id)}
                      >
                        {savedJobIds.has(selectedJob._id) ? "Saved ✓" : "Save Job"}
                      </button>
                    )}
                  </div>

                </div>

                <div className="job-detail-body">
                  <h3>Job Description</h3>
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {selectedJob.description}
                  </div>

                  {selectedJob.responsibilities && (
                    <>
                      <h3>Responsibilities</h3>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {selectedJob.responsibilities}
                      </div>
                    </>
                  )}

                  {selectedJob.requirements && (
                    <>
                      <h3>Requirements</h3>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {selectedJob.requirements}
                      </div>
                    </>
                  )}
                </div>

              </>
            ) : (
              <div className="empty-state">
                <p>Select a job from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Modal */}
      {applyForm.isOpen && (
        <div className="dialog-backdrop" onClick={closeApply} role="presentation">
          <div className="dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="dialog-head">
              <div>
                <h3>Apply for {selectedJob?.title}</h3>
                <p className="dash-muted" style={{ marginTop: 4 }}>
                  Submit your details and resume.
                </p>
              </div>
              <button className="dialog-close" type="button" onClick={closeApply} aria-label="Close">
                ×
              </button>
            </div>

            <div className="dialog-body">
              {message && <p className={message.includes("failed") ? "error" : ""}>{message}</p>}
              <form className="form" onSubmit={submitApply}>
                <input
                  placeholder="Full name"
                  value={applyForm.fullName}
                  onChange={(e) => setApplyForm((p) => ({ ...p, fullName: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={applyForm.email}
                  onChange={(e) => setApplyForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <input
                  placeholder="Phone"
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm((p) => ({ ...p, phone: e.target.value }))}
                  required
                />
                <textarea
                  placeholder="Cover letter (optional)"
                  value={applyForm.coverLetter}
                  onChange={(e) => setApplyForm((p) => ({ ...p, coverLetter: e.target.value }))}
                  rows={5}
                />

                <div className="file-field">
                  <label className="file-label">
                    Resume (PDF/DOC/DOCX)
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setApplyForm((p) => ({ ...p, resumeFile: e.target.files?.[0] || null }))}
                      required
                    />
                  </label>
                </div>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={applyForm.sendCopyToEmail}
                    onChange={(e) => setApplyForm((p) => ({ ...p, sendCopyToEmail: e.target.checked }))}
                  />
                  Email me a copy of this application
                </label>

                <div className="dialog-actions" style={{ marginTop: "1rem" }}>
                  <button className="btn secondary-btn" type="button" onClick={closeApply} disabled={applyForm.submitting}>
                    Cancel
                  </button>
                  <button className="btn" type="submit" disabled={applyForm.submitting}>
                    {applyForm.submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
