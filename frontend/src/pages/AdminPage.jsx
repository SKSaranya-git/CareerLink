import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [rejectReasonById, setRejectReasonById] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAdminData() {
    try {
      const [overviewRes, pendingRes] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/admin/pending-employers"),
      ]);
      setData(overviewRes.data);
      setPendingEmployers(pendingRes.data.pendingEmployers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin panel.");
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleDecision(employerId, status) {
    setError("");
    setMessage("");
    try {
      const reason = rejectReasonById[employerId] || "";
      if (status === "rejected" && !reason.trim()) {
        setError("Please provide a rejection reason before rejecting.");
        return;
      }
      const { data: response } = await api.patch(`/admin/employers/${employerId}/status`, {
        status,
        reason,
      });
      if (response.emailSent) {
        const successMessage = `Employer registration ${status}. Mail sent successfully to ${response.employer.email}.`;
        setMessage(successMessage);
        window.alert(successMessage);
      } else {
        const failureMessage = `Employer registration ${status}, but mail was not sent.\nReason: ${
          response.emailWarning || "Unknown email error"
        }`;
        setMessage(failureMessage);
        window.alert(failureMessage);
      }
      await loadAdminData();
    } catch (err) {
      const backendMessage = err.response?.data?.message || "Failed to update employer status.";
      setError(backendMessage);
      window.alert(`Action failed.\nReason: ${backendMessage}`);
    }
  }

  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!data) return <div className="container"><p>Loading admin data...</p></div>;

  return (
    <div className="container">
      <h1>Admin Panel</h1>
      {message && <p>{message}</p>}
      <div className="grid stats">
        <div className="card"><h3>Users</h3><p>{data.stats.usersCount}</p></div>
        <div className="card"><h3>Jobs</h3><p>{data.stats.jobsCount}</p></div>
        <div className="card"><h3>Applications</h3><p>{data.stats.applicationsCount}</p></div>
        <div className="card"><h3>Pending Employers</h3><p>{data.stats.pendingEmployers}</p></div>
      </div>

      <h2>Employer Registration Approvals</h2>
      {pendingEmployers.length === 0 && <p>No pending employer registrations.</p>}
      <div className="grid">
        {pendingEmployers.map((employer) => (
          <div key={employer._id} className="card">
            <p><strong>{employer.name}</strong></p>
            <p>{employer.email}</p>
            <p>{employer.companyName}</p>
            <p>Position: {employer.employmentPosition}</p>
            <p>Employee ID: {employer.companyEmployeeId}</p>
            <textarea
              rows={2}
              placeholder="Reason (required only for reject)"
              value={rejectReasonById[employer._id] || ""}
              onChange={(e) =>
                setRejectReasonById((prev) => ({ ...prev, [employer._id]: e.target.value }))
              }
            />
            <div className="row">
              <button className="btn" onClick={() => handleDecision(employer._id, "approved")}>
                Approve
              </button>
              <button className="btn danger" onClick={() => handleDecision(employer._id, "rejected")}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2>Recent Users</h2>
      <div className="grid">
        {data.recentUsers.map((user) => (
          <div key={user._id} className="card">
            <p>{user.name}</p>
            <p>{user.email}</p>
            <p>{user.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
