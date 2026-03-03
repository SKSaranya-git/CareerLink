import { useState } from "react";
import api from "../api/axios";

export default function PostJobPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    responsibilities: "",
    requirements: "",
    location: "",
    salary: "",
    employmentType: ["full-time"],
  });

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

  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/jobs", { ...form, salary: Number(form.salary) });
      setMessage("Job posted successfully.");
      setForm({
        title: "",
        description: "",
        responsibilities: "",
        requirements: "",
        location: "",
        salary: "",
        employmentType: ["full-time"],
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to post job.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h1 className="dash-title" style={{ marginBottom: 6 }}>Post Job</h1>
        <p className="dash-muted">Create a new job listing to find candidates.</p>
      </div>

      <div className="dash-panel" style={{ marginTop: 0, maxWidth: 800, margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className="form" style={{ maxWidth: 800, margin: "0 auto" }}>
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
            placeholder="Responsibilities (optional)"
            rows={4}
          />
          <textarea
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            placeholder="Requirements (optional)"
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
          <button className="btn" disabled={form.employmentType.length === 0} style={{
            width: "max-content", padding: "0.8rem 2rem", fontSize: "1.05rem", textAlign: "center", display: "block", margin: "0 auto"
          }}>
            Post Job
          </button>
        </form>
        {message && <p style={{ marginTop: "1rem", textAlign: "center" }}>{message}</p>}
      </div>
    </div >
  );
}
