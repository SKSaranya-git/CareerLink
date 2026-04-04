import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");

  const today = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const [usersRes, jobsRes, appsRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/jobs"),
          api.get("/admin/applications"),
        ]);
        setUsers(usersRes.data.users || []);
        setJobs(jobsRes.data.jobs || []);
        setApplications(appsRes.data.applications || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load admin dashboard");
      }
    }
    load();
  }, []);

  const recentUsers = users.slice(0, 5);

  return (
    <div>
      <div className="dash-header-row">
        <div>
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="muted">Welcome back — here’s what’s happening on the platform.</p>
        </div>
        <div className="dash-date">
          <div className="muted">Date</div>
          <div className="dash-date-value">{today}</div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="dash-stats">
        <div className="dash-stat">
          <div className="muted">Total Users</div>
          <div className="dash-stat-value">{users.length}</div>
        </div>
        <div className="dash-stat">
          <div className="muted">Active Jobs</div>
          <div className="dash-stat-value">{jobs.length}</div>
        </div>
        <div className="dash-stat">
          <div className="muted">Applications</div>
          <div className="dash-stat-value">{applications.length}</div>
        </div>
        <div className="dash-stat">
          <div className="muted">Pending Approvals</div>
          <div className="dash-stat-value">0</div>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h2>Recent Users</h2>
          <a href="/dashboard/users">View all →</a>
        </div>
        <div className="dash-table">
          <div className="dash-table-row dash-table-head">
            <div>User</div>
            <div>Role</div>
          </div>
          {recentUsers.map((u) => (
            <div key={u._id} className="dash-table-row">
              <div className="dash-user-cell">
                <div className="dash-avatar">{(u.name || "U")[0]?.toUpperCase()}</div>
                <div>
                  <div className="dash-user-name">{u.name}</div>
                  <div className="muted">{u.email}</div>
                </div>
              </div>
              <div>
                <span className="dash-role-pill">{u.role}</span>
              </div>
            </div>
          ))}
          {recentUsers.length === 0 ? <p className="muted">No users found.</p> : null}
        </div>
      </div>
    </div>
  );
}

