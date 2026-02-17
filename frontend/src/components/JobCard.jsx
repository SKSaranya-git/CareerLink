export default function JobCard({ job, canApply, onApply }) {
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
      {canApply && (
        <button className="btn" onClick={() => onApply(job._id)}>
          Apply Job
        </button>
      )}
    </div>
  );
}
