export default function JobCard({ job, canApply, isApplied, onApply, isSaved, onToggleSave }) {
  const postedDate = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "-";
  const company = job.employer?.companyName || job.employer?.name || "Employer";
  const descriptionPreview = (job.description || "").trim();

  return (
    <article className="job-grid-card">
      <div className="job-grid-card-head">
        <h3>{job.title}</h3>
        <span className="job-salary-pill">LKR {job.salary}</span>
      </div>

      <p className="job-grid-company">{company}</p>
      <p className="job-grid-meta">
        <span>{job.location}</span>
        <span>Posted {postedDate}</span>
      </p>

      <p className="job-grid-desc">
        {descriptionPreview.length > 180 ? `${descriptionPreview.slice(0, 180)}...` : descriptionPreview}
      </p>

      <div className="job-grid-tags">
        {Array.isArray(job.employmentType) ? (
          job.employmentType.map((type) => (
            <span key={type} className="job-type-pill">
              {String(type).replace("-", " ")}
            </span>
          ))
        ) : job.employmentType ? (
          <span className="job-type-pill">{String(job.employmentType).replace("-", " ")}</span>
        ) : null}
      </div>

      <div className="job-grid-actions">
        {canApply ? (
          isApplied ? (
            <button type="button" className="btn" disabled>
              Applied
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => onApply(job._id)}>
              Apply
            </button>
          )
        ) : (
          <button type="button" className="btn secondary-btn" disabled>
            Job Seeker Only
          </button>
        )}

        {canApply && typeof onToggleSave === "function" ? (
          <button
            type="button"
            className={`btn ${isSaved ? "" : "secondary-btn"}`}
            onClick={() => onToggleSave(job._id)}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
