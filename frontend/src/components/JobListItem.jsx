import { Link, useLocation } from "react-router-dom";
import { getEmployerId } from "../utils/jobEmployer";

export default function JobListItem({ job, isActive, onSelect, canApply, isApplied, onApply }) {
  const location = useLocation();
  const company = job.employer?.companyName || job.employer?.name || "Company";
  const employerId = getEmployerId(job);
  const employerProfileTo = location.pathname.startsWith("/dashboard")
    ? `/dashboard/employer/${employerId}`
    : `/employer/${employerId}`;

  return (
    <div
      className={`job-card-selectable ${isActive ? "active" : ""}`}
      onClick={() => onSelect(job._id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(job._id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <h3>{job.title}</h3>
      <p className="job-list-item-company">
        {employerId ? (
          <Link className="job-company-link" to={employerProfileTo} onClick={(e) => e.stopPropagation()}>
            {company}
          </Link>
        ) : (
          company
        )}
      </p>
      <p className="job-list-item-location">{job.location}</p>

      <div className="job-list-item-tags">
        {Array.isArray(job.employmentType) ? (
          job.employmentType.map((type) => (
            <span key={type} className="job-list-type-pill">
              {String(type).replace(/-/g, " ")}
            </span>
          ))
        ) : job.employmentType ? (
          <span className="job-list-type-pill">{String(job.employmentType).replace(/-/g, " ")}</span>
        ) : null}
        <span className="job-list-salary-pill">LKR {job.salary}</span>
      </div>

      <div className="job-list-item-footer">
        {canApply ? (
          isApplied ? (
            <button type="button" className="btn job-list-apply-btn" disabled onClick={(e) => e.stopPropagation()}>
              Applied
            </button>
          ) : (
            <button
              type="button"
              className="btn job-list-apply-btn"
              onClick={(e) => {
                e.stopPropagation();
                onApply(job._id);
              }}
            >
              Apply Now
            </button>
          )
        ) : (
          <button type="button" className="btn secondary-btn job-list-apply-btn" disabled onClick={(e) => e.stopPropagation()}>
            Sign in to apply
          </button>
        )}
      </div>
    </div>
  );
}
