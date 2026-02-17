import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [error, setError] = useState("");

  const today = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    async function load() {
      setError("");
      try {
        if (user?.role === "admin") {
          const [overviewRes, pendingRes] = await Promise.all([
            api.get("/admin/overview"),
            api.get("/admin/pending-employers"),
          ]);
          setStats(overviewRes.data.stats);
          setPendingEmployers(pendingRes.data.pendingEmployers || []);
        } else {
          setStats(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard.");
      }
    }

    if (user) load();
  }, [user]);

  if (error) return <p className="error">{error}</p>;

  if (user?.role !== "admin") {
    return (
      <div>
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-muted">Welcome back. Use the sidebar to view your profile and actions.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="dash-header-row">
        <div>
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="dash-muted">Welcome back — here’s what’s happening on the platform.</p>
        </div>
        <div className="dash-date-card">
          <p className="dash-muted">Today</p>
          <p className="dash-date">{today}</p>
        </div>
      </div>

      <div className="dash-cards">
        <div className="dash-stat">
          <p className="dash-stat-label">Total Users</p>
          <p className="dash-stat-value">{stats?.usersCount ?? "-"}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Active Jobs</p>
          <p className="dash-stat-value">{stats?.jobsCount ?? "-"}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Applications</p>
          <p className="dash-stat-value">{stats?.applicationsCount ?? "-"}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Pending Approvals</p>
          <p className="dash-stat-value">{stats?.pendingEmployers ?? "-"}</p>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h2>Employer Approvals</h2>
          <a className="dash-link-inline" href="/dashboard/approvals">
            View all →
          </a>
        </div>
        {pendingEmployers.length === 0 ? (
          <p className="dash-muted">No pending employer registrations.</p>
        ) : (
          <div className="dash-list">
            {pendingEmployers.slice(0, 4).map((emp) => (
              <div key={emp._id} className="dash-list-item">
                <div className="dash-avatar">{emp.name?.[0]?.toUpperCase()}</div>
                <div className="dash-list-main">
                  <p className="dash-list-title">{emp.name}</p>
                  <p className="dash-muted">{emp.email}</p>
                  <p className="dash-muted">{emp.companyName}</p>
                </div>
                <span className="dash-tag warning">pending</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

