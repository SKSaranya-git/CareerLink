import { useState } from "react";
import api from "../../api/axios";

export default function EditJobModal({ job, onClose, onUpdated }) {
    const [form, setForm] = useState({
        title: job.title || "",
        description: job.description || "",
        responsibilities: job.responsibilities || "",
        requirements: job.requirements || "",
        location: job.location || "",
        salary: job.salary || "",
        employmentType: job.employmentType || "full-time",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { data } = await api.put(`/jobs/${job._id}`, { ...form, salary: Number(form.salary) });
            onUpdated(data.job);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update job.");
            setLoading(false);
        }
    };

    return (
        <div className="dialog-backdrop">
            <div className="dialog">
                <div className="dialog-head">
                    <h3>Edit Job</h3>
                    <button className="dialog-close" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="dialog-body">
                    <form onSubmit={handleSubmit} className="form">
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Job title"
                            required
                        />
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Job description"
                            rows={5}
                            required
                        />
                        <textarea
                            value={form.responsibilities}
                            onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                            placeholder="Responsibilities"
                            rows={4}
                        />
                        <textarea
                            value={form.requirements}
                            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                            placeholder="Requirements"
                            rows={4}
                        />
                        <input
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="Location"
                            required
                        />
                        <input
                            type="number"
                            value={form.salary}
                            onChange={(e) => setForm({ ...form, salary: e.target.value })}
                            placeholder="Salary"
                            required
                        />
                        <select
                            value={form.employmentType}
                            onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                        >
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="internship">Internship</option>
                            <option value="contract">Contract</option>
                        </select>
                        {error && <p className="error">{error}</p>}
                        <div className="dialog-actions mt-2" style={{ marginTop: "1rem" }}>
                            <button type="button" className="btn secondary-btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
