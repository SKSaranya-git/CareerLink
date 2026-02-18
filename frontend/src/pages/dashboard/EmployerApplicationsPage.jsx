import { useEffect, useState } from "react";
import api from "../../api/axios";
import { getApplicationsForJob, updateApplicationStatus } from "../../api/applicationApi";
import { useAuth } from "../../context/AuthContext";

export default function EmployerApplicationsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null); // Job selected for modal
    const [applications, setApplications] = useState([]);
    const [isLoadingApps, setIsLoadingApps] = useState(false);
    const [error, setError] = useState(null);

    // Load employer's jobs
    useEffect(() => {
        const loadJobs = async () => {
            try {
                const { data } = await api.get(`/jobs?employer=${user._id}`);
                setJobs(data.jobs);
            } catch (err) {
                setError("Failed to load jobs.");
            }
        };

        if (user?._id) {
            loadJobs();
        }
    }, [user]);

    const openModal = async (job) => {
        setSelectedJob(job);
        setIsLoadingApps(true);
        try {
            const data = await getApplicationsForJob(job._id);
            setApplications(data.applications);
        } catch (err) {
            console.error(err);
            setApplications([]);
        } finally {
            setIsLoadingApps(false);
        }
    };

    const closeModal = () => {
        setSelectedJob(null);
        setApplications([]);
    };

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            await updateApplicationStatus(appId, newStatus);
            // Update local state in the modal
            setApplications((prev) =>
                prev.map((app) =>
                    app._id === appId ? { ...app, status: newStatus } : app
                )
            );
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    if (error) return <p className="text-danger">{error}</p>;

    return (
        <div className="dash-content">
            <div className="dash-header-row align-items-center">
                <div>
                    <h2 className="dash-title">Manage Applications</h2>
                    <p className="dash-muted">Track and manage candidates for your job postings.</p>
                </div>
            </div>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {jobs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">💼</div>
                    <h3>No Jobs Posted</h3>
                    <p>Create your first job posting to start receiving applications.</p>
                    <a href="/dashboard/post-job" className="btn mt-3 d-inline-block text-decoration-none">Post a Job</a>
                </div>
            ) : (
                <div className="row">
                    {jobs.map((job) => (
                        <div key={job._id} className="col-12 col-md-6 col-lg-4 mb-4">
                            <div className="job-card">
                                <div>
                                    <h5>{job.title}</h5>
                                    <div className="job-meta">
                                        <span>📍 {job.location}</span>
                                        <span>•</span>
                                        <span>🕒 {job.employmentType}</span>
                                    </div>
                                </div>
                                <div className="mt-auto pt-3 border-top text-center">
                                    <button
                                        className="btn secondary-btn w-100"
                                        onClick={() => openModal(job)}
                                    >
                                        View Applicants
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedJob && (
                <div className="dialog-backdrop" onClick={closeModal}>
                    <div
                        className="dialog"
                        style={{ maxWidth: "900px", width: "95%" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-head">
                            <div>
                                <h3>{selectedJob.title}</h3>
                                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Manage Applicants</p>
                            </div>
                            <button className="dialog-close" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="dialog-body p-0">
                            {isLoadingApps ? (
                                <div className="p-5 text-center">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted">Loading applications...</p>
                                </div>
                            ) : applications.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">👥</div>
                                    <p>No applications received for this job yet.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="applicant-table">
                                        <thead>
                                            <tr>
                                                <th>Applicant</th>
                                                <th>Ref</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map((app) => (
                                                <tr key={app._id}>
                                                    <td>
                                                        <div className="fw-bold">{app.applicant.name}</div>
                                                        <div className="text-muted small">{app.applicant.email}</div>
                                                    </td>
                                                    <td>
                                                        {app.coverLetter && (
                                                            <div title={app.coverLetter} style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "help" }}>
                                                                📝 <span className="text-muted small">Show Letter</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {new Date(app.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${app.status}`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        {app.status === "applied" || app.status === "reviewing" ? (
                                                            <div className="action-btn-group justify-content-end">
                                                                <button
                                                                    className="icon-btn accept"
                                                                    onClick={() => handleStatusUpdate(app._id, "accepted")}
                                                                    title="Accept Candidate"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button
                                                                    className="icon-btn reject"
                                                                    onClick={() => handleStatusUpdate(app._id, "rejected")}
                                                                    title="Reject Candidate"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                                                                onClick={() => handleStatusUpdate(app._id, "reviewing")}
                                                            >
                                                                Re-evaluate
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getStatusColor(status) {
    switch (status) {
        case 'applied': return 'info';
        case 'reviewing': return 'warning';
        case 'accepted': return 'success';
        case 'rejected': return 'danger';
        default: return 'secondary';
    }
}
