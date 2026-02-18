import { useEffect, useState } from "react";
import { getMyApplications } from "../../api/applicationApi";

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadApplications = async () => {
            try {
                const data = await getMyApplications();
                setApplications(data.applications);
            } catch (err) {
                setError("Failed to load applications.");
            } finally {
                setLoading(false);
            }
        };

        loadApplications();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case "applied":
                return <span className="badge badge-info">Applied</span>;
            case "reviewing":
                return <span className="badge badge-warning">Reviewing</span>;
            case "accepted":
                return <span className="badge badge-success">Accepted</span>;
            case "rejected":
                return <span className="badge badge-danger">Rejected</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;

    return (
        <div className="card">
            <h2>My Applications</h2>
            {applications.length === 0 ? (
                <p>You haven't applied to any jobs yet.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Salary</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <tr key={app._id}>
                                <td>{app.job.title}</td>
                                <td>{app.job.employer?.companyName || app.job.employer?.name}</td>
                                <td>{app.job.location}</td>
                                <td>LKR {app.job.salary}</td>
                                <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                <td>{getStatusBadge(app.status)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
