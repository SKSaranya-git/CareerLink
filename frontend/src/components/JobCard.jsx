export default function JobCard({ job, isActive, onClick }) {
  return (
    <div
      className={`job-card-selectable ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <h3>{job.title}</h3>
      <p style={{ fontWeight: 600, color: "#374151", marginBottom: '0.2rem' }}>
        {job.employer?.companyName || job.employer?.name}
      </p>
      <p style={{ margin: 0 }}>{job.location}</p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
        {Array.isArray(job.employmentType) ? (
          job.employmentType.map(type => (
            <span key={type} className="dash-tag" style={{ background: "#f3f4f6", color: "#374151" }}>
              {type.replace("-", " ")}
            </span>
          ))
        ) : (
          <span className="dash-tag" style={{ background: "#f3f4f6", color: "#374151" }}>
            {job.employmentType}
          </span>
        )}
        <span className="dash-tag" style={{ background: "#ecfdf5", color: "#065f46" }}>
          LKR {job.salary}
        </span>
      </div>
    </div>
  );
}
