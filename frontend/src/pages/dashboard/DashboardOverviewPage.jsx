import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function maxTimelineValue(timeline) {
  return timeline.reduce((max, day) => {
    return Math.max(
      max,
      day.users || 0,
      day.jobs || 0,
      day.applications || 0,
      day.notifications || 0
    );
  }, 1);
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [analytics, setAnalytics] = useState({
    timeline: [],
    roleBreakdown: [],
    applicationStatusBreakdown: [],
    notificationSummary: null,
    generatedAt: "",
  });
  const [error, setError] = useState("");

  const today = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError("");
      try {
        if (user?.role === "admin") {
          const [overviewRes, pendingRes, analyticsRes] = await Promise.all([
            api.get("/admin/overview"),
            api.get("/admin/pending-employers"),
            api.get("/admin/analytics"),
          ]);
          if (!mounted) return;
          setStats(overviewRes.data.stats);
          setPendingEmployers(pendingRes.data.pendingEmployers || []);
          setAnalytics({
            timeline: analyticsRes.data.timeline || [],
            roleBreakdown: analyticsRes.data.roleBreakdown || [],
            applicationStatusBreakdown: analyticsRes.data.applicationStatusBreakdown || [],
            notificationSummary: analyticsRes.data.notificationSummary || null,
            generatedAt: analyticsRes.data.generatedAt || "",
          });
        } else {
          if (!mounted) return;
          setStats(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || "Failed to load dashboard.");
        }
      }
    }

    if (user) {
      load();
      const intervalId = setInterval(load, 15000);
      return () => {
        mounted = false;
        clearInterval(intervalId);
      };
    }

    return undefined;
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

  const maxValue = maxTimelineValue(analytics.timeline);

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
        <div className="dash-stat">
          <p className="dash-stat-label">Notifications (7 days)</p>
          <p className="dash-stat-value">{analytics.notificationSummary?.notificationsLast7Days ?? 0}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Acknowledgement Rate</p>
          <p className="dash-stat-value">{analytics.notificationSummary?.acknowledgementRate ?? 0}%</p>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h2>7-Day Activity Graph</h2>
          <p className="dash-muted">
            Auto-updates every 15s {analytics.generatedAt ? `• Last sync ${new Date(analytics.generatedAt).toLocaleTimeString()}` : ""}
          </p>
        </div>
        {analytics.timeline.length === 0 ? (
          <p className="dash-muted">No recent activity to graph yet.</p>
        ) : (
          <div className="dash-graph">
            {analytics.timeline.map((day) => (
              <div key={day.day} className="dash-graph-group">
                <div className="dash-graph-bars">
                  <div
                    className="dash-graph-bar users"
                    title={`Users: ${day.users}`}
                    style={{ height: `${Math.max(8, (day.users / maxValue) * 100)}%` }}
                  />
                  <div
                    className="dash-graph-bar jobs"
                    title={`Jobs: ${day.jobs}`}
                    style={{ height: `${Math.max(8, (day.jobs / maxValue) * 100)}%` }}
                  />
                  <div
                    className="dash-graph-bar applications"
                    title={`Applications: ${day.applications}`}
                    style={{ height: `${Math.max(8, (day.applications / maxValue) * 100)}%` }}
                  />
                  <div
                    className="dash-graph-bar notifications"
                    title={`Notifications: ${day.notifications || 0}`}
                    style={{
                      height: `${Math.max(
                        8,
                        (((day.notifications || 0) / maxValue) || 0) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="dash-graph-day">{day.day.slice(5)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="dash-legend">
          <span className="dash-legend-item users">Users</span>
          <span className="dash-legend-item jobs">Jobs</span>
          <span className="dash-legend-item applications">Applications</span>
          <span className="dash-legend-item notifications">Notifications</span>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h2>Role and Application Analytics</h2>
        </div>
        <div className="dash-breakdown-grid">
          <div>
            <p className="dash-list-title">Users by Role</p>
            {(analytics.roleBreakdown || []).map((item) => (
              <div key={item.role} className="dash-breakdown-row">
                <span className="dash-muted">{item.role.replace("_", " ")}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <div>
            <p className="dash-list-title">Applications by Status</p>
            {(analytics.applicationStatusBreakdown || []).map((item) => (
              <div key={item.status} className="dash-breakdown-row">
                <span className="dash-muted">{item.status}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
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

