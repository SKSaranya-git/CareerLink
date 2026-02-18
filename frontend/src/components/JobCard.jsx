export default function JobCard({ job, canApply, application, onApply }) {
  const isApplied = !!application;
  const isRejected = application?.status === "rejected";

  return (
    <div className="card">
      <h3>{job.title}</h3>
      <p>{job.description}</p>
      <p>
        <strong>Location:</strong> {job.location}
      </p>
      <p>
        <strong>Salary:</strong> LKR {job.salary}
      </p>
      <p>
        <strong>Type:</strong> {job.employmentType}
      </p>
      <p>
        <strong>Employer:</strong> {job.employer?.companyName || job.employer?.name}
      </p>

      {isApplied && !isRejected && (
        <p className="text-info">
          <strong>Status:</strong> {application.status}
        </p>
      )}

      {canApply && (
        <>
          {(!isApplied || isRejected) ? (
            <button className="btn" onClick={() => onApply(job._id)}>
              {isRejected ? "Apply Again" : "Apply Job"}
            </button>
          ) : (
            <button className="btn btn-secondary" disabled>
              Applied
            </button>
          )}
        </>
      )}
    </div>
  );
}
