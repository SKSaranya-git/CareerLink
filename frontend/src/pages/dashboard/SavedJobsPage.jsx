import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function SavedJobsPage() {
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const loadSavedJobs = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/users/saved-jobs");
            setSavedJobs(data.savedJobs || []);
        } catch (err) {
            setMessage(err.response?.data?.message || "Failed to load saved jobs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSavedJobs();
    }, []);

    const handleUnsave = async (jobId) => {
        try {
            await api.delete(`/users/saved-jobs/${jobId}`);
            setSavedJobs((prev) => prev.filter((j) => j._id !== jobId));
            setMessage("Job removed from saved.");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || "Failed to unsave job.");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    return (
        <div>
            <h1 className="dash-title">Saved Jobs</h1>
            <p className="dash-muted">Jobs you've saved for later.</p>

            {message && (
                <div
                    style={{
                        padding: "0.75rem 1rem",
                        background: "#ecfdf5",
                        color: "#065f46",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                    }}
                >
                    {message}
                </div>
            )}

            {loading ? (
                <p>Loading saved jobs...</p>
            ) : savedJobs.length === 0 ? (
                <div className="empty-state" style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>
                        You haven't saved any jobs yet.
                    </p>
                    <p className="dash-muted">
                        Browse the <a href="/jobs" style={{ color: "#6366f1" }}>Jobs</a> page and click "Save Job" to bookmark listings.
                    </p>
                </div>
            ) : (
                <div className="dash-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {savedJobs.map((job) => (
                        <div
                            key={job._id}
                            className="card"
                            style={{
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: "1rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <h3 style={{ margin: "0 0 0.25rem" }}>{job.title}</h3>
                                <p style={{ fontWeight: 600, color: "#374151", margin: "0 0 0.25rem" }}>
                                    {job.employer?.companyName || job.employer?.name || "—"}
                                </p>
                                <p className="dash-muted" style={{ margin: "0 0 0.5rem" }}>
                                    {job.location}
                                </p>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {Array.isArray(job.employmentType) ? (
                                        job.employmentType.map((type) => (
                                            <span
                                                key={type}
                                                className="dash-tag"
                                                style={{ background: "#f3f4f6", color: "#374151" }}
                                            >
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
                            <button
                                className="btn secondary-btn"
                                onClick={() => handleUnsave(job._id)}
                                style={{ whiteSpace: "nowrap" }}
                            >
                                Unsave
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
