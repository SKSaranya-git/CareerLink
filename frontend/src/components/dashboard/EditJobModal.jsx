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
        employmentType: Array.isArray(job.employmentType) ? job.employmentType : (job.employmentType ? [job.employmentType] : ["full-time"]),
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTypeChange = (value) => {
        setForm((prev) => {
            const current = prev.employmentType;
            if (current.includes(value)) {
                return { ...prev, employmentType: current.filter((t) => t !== value) };
            } else {
                return { ...prev, employmentType: [...current, value] };
            }
        });
    };

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
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                            {["full-time", "part-time", "internship", "contract"].map(type => (
                                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.employmentType.includes(type)}
                                        onChange={() => handleTypeChange(type)}
                                    />
                                    <span style={{ textTransform: 'capitalize' }}>{type.replace("-", " ")}</span>
                                </label>
                            ))}
                        </div>
                        {error && <p className="error">{error}</p>}
                        <div className="dialog-actions mt-2" style={{ marginTop: "1rem" }}>
                            <button type="button" className="btn secondary-btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn" disabled={loading || form.employmentType.length === 0}>
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
