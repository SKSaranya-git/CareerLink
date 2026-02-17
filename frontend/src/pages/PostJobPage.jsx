import { useState } from "react";
import api from "../api/axios";

export default function PostJobPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    employmentType: "full-time",
  });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/jobs", { ...form, salary: Number(form.salary) });
      setMessage("Job posted successfully.");
      setForm({
        title: "",
        description: "",
        location: "",
        salary: "",
        employmentType: "full-time",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to post job.");
    }
  };

  return (
    <div className="container narrow">
      <h1>Post Job</h1>
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
        <button className="btn">Post Job</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
