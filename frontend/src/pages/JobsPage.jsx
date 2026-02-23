import { useEffect, useState } from "react";
import api from "../api/axios";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();
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
    const { data } = await api.get(`/jobs${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    setJobs(data.jobs);
  };

  useEffect(() => {
    loadJobs();
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
            onApply={openApply}
            isApplied={appliedJobIds.has(job._id)}
          />
        ))}
      </div>

      {applyForm.isOpen && (
        <div className="dialog-backdrop" onClick={closeApply} role="presentation">
          <div className="dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="dialog-head">
              <div>
                <h3>Apply for Job</h3>
                <p className="dash-muted" style={{ marginTop: 4 }}>
                  Submit your details and resume. You can optionally email yourself a copy.
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
                />
                <input
                  placeholder="Email"
                  value={applyForm.email}
                  onChange={(e) => setApplyForm((p) => ({ ...p, email: e.target.value }))}
                />
                <input
                  placeholder="Phone"
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm((p) => ({ ...p, phone: e.target.value }))}
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

                <div className="dialog-actions">
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
