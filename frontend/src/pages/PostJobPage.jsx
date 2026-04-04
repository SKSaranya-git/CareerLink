import { useState } from "react";
import api from "../api/axios";

const INITIAL_FORM = {
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  location: "",
  salary: "",
  employmentType: ["full-time"],
};

export default function PostJobPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleTypeChange = (value) => {
    setForm((prev) => {
      const current = prev.employmentType;
      if (current.includes(value)) {
        return { ...prev, employmentType: current.filter((t) => t !== value) };
      }
      return { ...prev, employmentType: [...current, value] };
    });
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setSubmitting(true);

    try {
      await api.post("/jobs", { ...form, salary: Number(form.salary) });
      setMessage("Job posted successfully.");
      setForm(INITIAL_FORM);
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Failed to post job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="post-job-page">
      <div className="post-job-header">
        <h1 className="dash-title">Create a New Job Posting</h1>
        <p className="dash-muted">
          Fill in the role details clearly so suitable candidates can find and apply quickly.
        </p>
      </div>

      <div className="dash-panel post-job-shell">
        <form onSubmit={handleSubmit} className="post-job-form-grid">
          <label>
            Job title
            <input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Frontend Developer"
              required
            />
          </label>

          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g., Colombo / Remote"
              required
            />
          </label>

          <label className="span-2">
            Job description
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={5}
              placeholder="Describe the role, team, and expected outcomes."
              required
            />
          </label>

          <label className="span-2">
            Responsibilities (optional)
            <textarea
              value={form.responsibilities}
              onChange={(e) => handleChange("responsibilities", e.target.value)}
              rows={4}
              placeholder="List key day-to-day responsibilities."
            />
          </label>

          <label className="span-2">
            Requirements (optional)
            <textarea
              value={form.requirements}
              onChange={(e) => handleChange("requirements", e.target.value)}
              rows={4}
              placeholder="List required skills, tools, and experience."
            />
          </label>

          <label>
            Salary (LKR)
            <input
              type="number"
              min="0"
              value={form.salary}
              onChange={(e) => handleChange("salary", e.target.value)}
              placeholder="e.g., 150000"
              required
            />
          </label>

          <div className="post-job-type-field">
            <p>Employment type</p>
            <div className="post-job-type-list">
              {["full-time", "part-time", "internship", "contract"].map((type) => (
                <label key={type} className="post-job-type-chip">
                  <input
                    type="checkbox"
                    checked={form.employmentType.includes(type)}
                    onChange={() => handleTypeChange(type)}
                  />
                  <span>{type.replace("-", " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="span-2 post-job-actions post-job-actions-centered">
            <button className="btn post-job-submit-btn" disabled={submitting || form.employmentType.length === 0}>
              {submitting ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>

        {message ? (
          <p className={isError ? "post-job-message error" : "post-job-message dash-success"}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
