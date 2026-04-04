import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import JobListItem from "../components/JobListItem";
import JobDetailPane from "../components/JobDetailPane";
import { useAuth } from "../context/AuthContext";

function savedJobsStorageKey(user) {
  const id = user?._id || user?.id;
  return id ? `jobboard_saved_jobs_${id}` : "jobboard_saved_jobs_guest";
}

function loadSavedJobIds(user) {
  try {
    const raw = localStorage.getItem(savedJobsStorageKey(user));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function persistSavedJobIds(user, idsSet) {
  try {
    localStorage.setItem(savedJobsStorageKey(user), JSON.stringify([...idsSet]));
  } catch {
    // ignore quota / private mode
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [datePosted, setDatePosted] = useState("");

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());
  const [savedJobIds, setSavedJobIds] = useState(() => new Set());

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
      const { data } = await api.get("/jobs");
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    setSavedJobIds(loadSavedJobIds(user));
  }, [user?._id, user?.id]);

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
        } else if (job.employmentType !== jobType) {
          return false;
        }
      }

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

  const hasActiveFilters = Boolean(search.trim() || minSalary || jobType || experienceLevel || datePosted);
  const visibleJobs = hasActiveFilters ? filteredJobs : jobs;

  useEffect(() => {
    setSelectedJobId((prev) => {
      if (prev && visibleJobs.some((j) => j._id === prev)) return prev;
      return visibleJobs[0]?._id ?? null;
    });
  }, [visibleJobs]);

  const selectedJob = useMemo(
    () => visibleJobs.find((j) => j._id === selectedJobId) || null,
    [visibleJobs, selectedJobId]
  );

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

  const clearFilters = () => {
    setSearch("");
    setMinSalary("");
    setJobType("");
    setExperienceLevel("");
    setDatePosted("");
  };

  const toggleSaveJob = useCallback(
    (jobId) => {
      if (!user || user.role !== "job_seeker") return;
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (next.has(jobId)) next.delete(jobId);
        else next.add(jobId);
        persistSavedJobIds(user, next);
        return next;
      });
    },
    [user]
  );

  const applyingJob = jobs.find((job) => job._id === applyForm.jobId) || null;
  const isSeeker = user?.role === "job_seeker";

  return (
    <div className="jobs-page-container jobs-page-split">
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
        <button type="button" className="btn jobs-find-btn" onClick={loadJobs}>
          Find Jobs
        </button>
        <button type="button" className="btn secondary-btn" onClick={clearFilters}>
          Clear
        </button>
      </div>

      {message && !applyForm.isOpen ? <div className="jobs-feedback">{message}</div> : null}

      {loading ? (
        <p className="dash-muted">Loading jobs...</p>
      ) : visibleJobs.length === 0 ? (
        <div className="dash-panel">
          <p className="dash-muted">No jobs match your criteria.</p>
        </div>
      ) : (
        <div className="jobs-layout">
          <div className="jobs-list-pane">
            {visibleJobs.map((job) => (
              <JobListItem
                key={job._id}
                job={job}
                isActive={selectedJobId === job._id}
                onSelect={setSelectedJobId}
                canApply={isSeeker}
                isApplied={appliedJobIds.has(job._id)}
                onApply={openApply}
              />
            ))}
          </div>
          <JobDetailPane
            job={selectedJob}
            canApply={isSeeker}
            isApplied={selectedJob ? appliedJobIds.has(selectedJob._id) : false}
            isSaved={selectedJob ? savedJobIds.has(selectedJob._id) : false}
            onApply={openApply}
            onToggleSave={isSeeker ? toggleSaveJob : undefined}
          />
        </div>
      )}

      {applyForm.isOpen ? (
        <div className="dialog-backdrop" onClick={closeApply} role="presentation">
          <div className="dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="dialog-head">
              <div>
                <h3>Apply for {applyingJob?.title || "this role"}</h3>
                <p className="dash-muted" style={{ marginTop: 4 }}>
                  Submit your details and resume.
                </p>
              </div>
              <button className="dialog-close" type="button" onClick={closeApply} aria-label="Close">
                ×
              </button>
            </div>

            <div className="dialog-body">
              {message ? <p className={message.includes("failed") ? "error" : ""}>{message}</p> : null}
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
      ) : null}
    </div>
  );
}
