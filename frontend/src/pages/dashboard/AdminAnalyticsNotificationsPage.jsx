import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "info",
  isActive: true,
  audienceRoles: ["all"],
};

function pct(value, total) {
  if (!total) return 0;
  return Math.max(6, Math.round((value / total) * 100));
}

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "admin", label: "Admin" },
  { value: "employer", label: "Employer" },
  { value: "job_seeker", label: "Job Seeker" },
];

function formatAudienceLabel(role) {
  if (role === "job_seeker") return "Job Seeker";
  if (role === "all") return "All Users";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AdminAnalyticsNotificationsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [analyticsRes, notificationsRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/notifications"),
      ]);
      setAnalytics(analyticsRes.data);
      setNotifications(notificationsRes.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics and notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      loadAll();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const dayMax = useMemo(() => {
    if (!analytics?.dailyActivity?.length) return 1;
    return Math.max(
      1,
      ...analytics.dailyActivity.flatMap((day) => [day.users, day.jobs, day.applications])
    );
  }, [analytics]);

  const roleTotal = useMemo(
    () => (analytics?.roleDistribution || []).reduce((sum, item) => sum + item.count, 0),
    [analytics]
  );
  const statusTotal = useMemo(
    () => (analytics?.applicationStatusDistribution || []).reduce((sum, item) => sum + item.count, 0),
    [analytics]
  );

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      message: item.message || "",
      type: item.type || "info",
      isActive: !!item.isActive,
      audienceRoles:
        Array.isArray(item.audienceRoles) && item.audienceRoles.length ? item.audienceRoles : ["all"],
    });
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setEditingId("");
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        isActive: form.isActive,
        audienceRoles: form.audienceRoles,
      };
      if (editingId) {
        await api.patch(`/admin/notifications/${editingId}`, payload);
        setMessage("Notification updated successfully.");
      } else {
        await api.post("/admin/notifications", payload);
        setMessage("Notification created successfully.");
      }
      cancelEdit();
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save notification.");
    } finally {
      setSaving(false);
    }
  }

  function toggleAudienceRole(role) {
    setForm((prev) => {
      const current = prev.audienceRoles || [];
      if (role === "all") {
        return { ...prev, audienceRoles: ["all"] };
      }

      let nextRoles = current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current.filter((item) => item !== "all"), role];

      if (!nextRoles.length) nextRoles = ["all"];
      return { ...prev, audienceRoles: nextRoles };
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this notification?");
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await api.delete(`/admin/notifications/${id}`);
      if (editingId === id) cancelEdit();
      setMessage("Notification deleted.");
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notification.");
    }
  }

  return (
    <div className="admin-analytics-page">
      <div className="dash-header-row">
        <div>
          <h1 className="dash-title">Analytics & Notification Management</h1>
          <p className="dash-muted">
            Live admin analytics with charts and complete notification CRUD management.
          </p>
        </div>
        <button className="btn secondary-btn" onClick={loadAll} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh now"}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <div className="dash-cards admin-analytics-stats">
        <div className="dash-stat admin-analytics-stat-card">
          <p className="dash-stat-label">Total Users</p>
          <p className="dash-stat-value">{analytics?.totals?.usersCount ?? "-"}</p>
        </div>
        <div className="dash-stat admin-analytics-stat-card">
          <p className="dash-stat-label">Active Jobs</p>
          <p className="dash-stat-value">{analytics?.totals?.jobsCount ?? "-"}</p>
        </div>
        <div className="dash-stat admin-analytics-stat-card">
          <p className="dash-stat-label">Applications</p>
          <p className="dash-stat-value">{analytics?.totals?.applicationsCount ?? "-"}</p>
        </div>
        <div className="dash-stat admin-analytics-stat-card">
          <p className="dash-stat-label">Active Notifications</p>
          <p className="dash-stat-value">{analytics?.totals?.activeNotifications ?? "-"}</p>
        </div>
      </div>

      <div className="dash-panel admin-analytics-panel">
        <div className="dash-panel-head">
          <h2>7-Day Activity Graph</h2>
          <p className="dash-muted">
            Last updated:{" "}
            {analytics?.lastUpdatedAt ? new Date(analytics.lastUpdatedAt).toLocaleString() : "--"}
          </p>
        </div>
        <div className="mini-legend">
          <span className="legend-chip users">Users</span>
          <span className="legend-chip jobs">Jobs</span>
          <span className="legend-chip applications">Applications</span>
        </div>
        <div className="activity-chart">
          {(analytics?.dailyActivity || []).map((day) => (
            <div key={day.date} className="activity-day">
              <div className="bars">
                <div
                  className="bar users"
                  style={{ height: `${Math.round((day.users / dayMax) * 100)}%` }}
                  title={`Users: ${day.users}`}
                />
                <div
                  className="bar jobs"
                  style={{ height: `${Math.round((day.jobs / dayMax) * 100)}%` }}
                  title={`Jobs: ${day.jobs}`}
                />
                <div
                  className="bar applications"
                  style={{ height: `${Math.round((day.applications / dayMax) * 100)}%` }}
                  title={`Applications: ${day.applications}`}
                />
              </div>
              <p className="chart-label">{day.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-distribution-grid">
        <div className="dash-panel admin-analytics-panel">
          <div className="dash-panel-head">
            <h2>User Role Distribution</h2>
          </div>
          <div className="dist-wrap">
            {(analytics?.roleDistribution || []).map((item) => (
              <div key={item.role} className="dist-row">
                <p className="dist-label">
                  {item.role} ({item.count})
                </p>
                <div className="dist-bar-track">
                  <div className="dist-bar-fill" style={{ width: `${pct(item.count, roleTotal)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-panel admin-analytics-panel">
          <div className="dash-panel-head">
            <h2>Application Status Distribution</h2>
          </div>
          <div className="dist-wrap">
            {(analytics?.applicationStatusDistribution || []).map((item) => (
              <div key={item.status} className="dist-row">
                <p className="dist-label">
                  {item.status} ({item.count})
                </p>
                <div className="dist-bar-track">
                  <div className="dist-bar-fill status" style={{ width: `${pct(item.count, statusTotal)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-notification-layout">
        <div className="dash-panel admin-analytics-panel">
          <div className="dash-panel-head">
            <h2>{editingId ? "Edit Notification" : "Create Notification"}</h2>
          </div>
          <form className="form admin-notification-form" onSubmit={handleSubmit}>
            <input
              placeholder="Notification title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <textarea
              rows={4}
              placeholder="Notification message"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              required
            />
            <div className="row admin-notification-type-row">
              <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
                <option value="info">info</option>
                <option value="success">success</option>
                <option value="warning">warning</option>
                <option value="critical">critical</option>
              </select>
              <label className="notif-toggle">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
            <div>
              <p className="dash-muted">Send To (actor/role)</p>
              <div className="audience-grid">
                {AUDIENCE_OPTIONS.map((option) => (
                  <label key={option.value} className="audience-chip">
                    <input
                      type="checkbox"
                      checked={form.audienceRoles.includes(option.value)}
                      onChange={() => toggleAudienceRole(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="row">
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Notification" : "Create Notification"}
              </button>
              {editingId ? (
                <button className="btn secondary-btn" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="dash-panel admin-analytics-panel">
          <div className="dash-panel-head">
            <h2>All Notifications</h2>
          </div>
          {notifications.length === 0 ? (
            <p className="dash-muted">No notifications created yet.</p>
          ) : (
            <div className="dash-list">
              {notifications.map((n) => (
                <div key={n._id} className="dash-list-item notification-item admin-notification-item">
                  <div className="dash-list-main">
                    <p className="dash-list-title">{n.title}</p>
                    <p className="dash-muted">{n.message}</p>
                    <div className="admin-notification-meta-row">
                      <span className={`admin-notification-chip ${n.type || "info"}`}>
                        {n.type || "info"}
                      </span>
                      <span className={`admin-notification-chip ${n.isActive ? "success" : "warning"}`}>
                        {n.isActive ? "active" : "inactive"}
                      </span>
                      <span className="dash-muted">By {n.createdBy?.name || "Admin"}</span>
                      <span className="dash-muted">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="dash-muted">
                      Audience:{" "}
                      {Array.isArray(n.audienceRoles)
                        ? n.audienceRoles.map(formatAudienceLabel).join(", ")
                        : "All Users"}
                    </p>
                  </div>
                  <div className="row">
                    <button className="btn secondary-btn" onClick={() => startEdit(n)}>
                      Edit
                    </button>
                    <button className="btn danger" onClick={() => handleDelete(n._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
