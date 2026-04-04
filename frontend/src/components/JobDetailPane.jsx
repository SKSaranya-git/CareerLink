import { Link, useLocation } from "react-router-dom";
import { getEmployerId } from "../utils/jobEmployer";

export default function JobDetailPane({
  job,
  canApply,
  isApplied,
  isSaved,
  onApply,
  onToggleSave,
}) {
  const location = useLocation();

  if (!job) {
    return (
      <div className="job-detail-pane job-detail-pane-empty">
        <p className="dash-muted">Select a job from the list to view details.</p>
      </div>
    );
  }

  const company = job.employer?.companyName || job.employer?.name || "Employer";
  const employerId = getEmployerId(job);
  const employerProfileTo = location.pathname.startsWith("/dashboard")
    ? `/dashboard/employer/${employerId}`
    : `/employer/${employerId}`;
  const posted = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-";

  return (
    <div className="job-detail-pane">
      <div className="job-detail-header">
        <h2>{job.title}</h2>
        <div className="job-detail-meta">
          {employerId ? (
            <Link className="job-company-link job-detail-company-link" to={employerProfileTo}>
              {company}
            </Link>
          ) : (
            <strong>{company}</strong>
          )}
          <span aria-hidden="true">•</span>
          <span>{job.location}</span>
          <span aria-hidden="true">•</span>
          <span>Posted {posted}</span>
        </div>

        <div className="job-detail-tag-row">
          {Array.isArray(job.employmentType) ? (
            job.employmentType.map((type) => (
              <span key={type} className="job-detail-type-pill">
                {String(type).replace(/-/g, " ")}
              </span>
            ))
          ) : job.employmentType ? (
            <span className="job-detail-type-pill">{String(job.employmentType).replace(/-/g, " ")}</span>
          ) : null}
          <span className="job-detail-salary-pill">LKR {job.salary}</span>
        </div>

        <div className="job-detail-actions">
          {canApply ? (
            isApplied ? (
              <button type="button" className="btn" disabled title="You already applied">
                Applied ✓
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => onApply(job._id)}>
                Apply Now
              </button>
            )
          ) : (
            <p className="dash-muted job-detail-login-hint">Sign in as a job seeker to apply.</p>
          )}
          {canApply && typeof onToggleSave === "function" ? (
            <button
              type="button"
              className={`btn ${isSaved ? "" : "secondary-btn"}`}
              onClick={() => onToggleSave(job._id)}
            >
              {isSaved ? "Saved ✓" : "Save"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="job-detail-body">
        <h3>Job Description</h3>
        <div className="job-detail-text">{job.description}</div>

        {job.responsibilities?.trim() ? (
          <>
            <h3>Responsibilities</h3>
            <div className="job-detail-text job-detail-text-pre">{job.responsibilities}</div>
          </>
        ) : null}

        {job.requirements?.trim() ? (
          <>
            <h3>Requirements</h3>
            <div className="job-detail-text job-detail-text-pre">{job.requirements}</div>
          </>
        ) : null}
      </div>
    </div>
  );
}
