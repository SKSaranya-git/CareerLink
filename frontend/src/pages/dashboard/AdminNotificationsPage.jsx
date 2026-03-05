import { useEffect, useState } from "react";
import api from "../../api/axios";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "employer", label: "Employer / Employee" },
  { value: "job_seeker", label: "Job Seeker" },
];
const ALL_ROLE_VALUES = ROLE_OPTIONS.map((option) => option.value);

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetRoles: ["job_seeker"],
  });
  const [editingId, setEditingId] = useState("");
  const [audienceMode, setAudienceMode] = useState("selected");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadNotifications() {
    const { data } = await api.get("/admin/notifications");
    setNotifications(data.notifications || []);
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await loadNotifications();
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || "Failed to load notifications.");
        }
      }
    }

    bootstrap();
    const intervalId = setInterval(() => {
      bootstrap();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  function toggleRole(role) {
    setForm((prev) => {
      const exists = prev.targetRoles.includes(role);
      const nextRoles = exists
        ? prev.targetRoles.filter((item) => item !== role)
        : [...prev.targetRoles, role];

      return {
        ...prev,
        targetRoles: nextRoles.length > 0 ? nextRoles : prev.targetRoles,
      };
    });
  }

  function resetForm() {
    setEditingId("");
    setAudienceMode("selected");
    setForm({ title: "", message: "", targetRoles: ["job_seeker"] });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (editingId) {
        await api.put(`/admin/notifications/${editingId}`, {
          ...form,
          targetRoles: audienceMode === "all" ? ALL_ROLE_VALUES : form.targetRoles,
        });
        setMessage("Notification updated.");
      } else {
        await api.post("/admin/notifications", {
          ...form,
          targetRoles: audienceMode === "all" ? ALL_ROLE_VALUES : form.targetRoles,
        });
        setMessage("Notification created.");
      }
      resetForm();
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save notification.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(notification) {
    const existingTargets = notification.targetRoles?.length
      ? notification.targetRoles
      : ["job_seeker"];
    const isAllAudience =
      ALL_ROLE_VALUES.every((role) => existingTargets.includes(role)) &&
      existingTargets.length === ALL_ROLE_VALUES.length;

    setEditingId(notification._id);
    setAudienceMode(isAllAudience ? "all" : "selected");
    setForm({
      title: notification.title || "",
      message: notification.message || "",
      targetRoles: existingTargets,
    });
  }

  async function handleDelete(notificationId) {
    setError("");
    setMessage("");
    const confirmDelete = window.confirm("Delete this notification?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/notifications/${notificationId}`);
      setMessage("Notification deleted.");
      if (editingId === notificationId) resetForm();
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notification.");
    }
  }

  return (
    <div>
      <h1 className="dash-title">Notification Management</h1>
      <p className="dash-muted">
        Create, edit, delete and target notifications to specific actors from the admin dashboard.
      </p>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h2>{editingId ? "Edit Notification" : "Create Notification"}</h2>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              placeholder="System Update"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
              minLength={3}
            />
          </label>

          <label>
            Message
            <textarea
              rows={4}
              placeholder="Write the notification details..."
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              required
              minLength={5}
            />
          </label>

          <div>
            <p className="dash-muted">Who to send</p>
            <div className="dash-audience-mode">
              <label>
                <input
                  type="radio"
                  checked={audienceMode === "all"}
                  onChange={() => {
                    setAudienceMode("all");
                    setForm((prev) => ({ ...prev, targetRoles: ALL_ROLE_VALUES }));
                  }}
                />
                All actors
              </label>
              <label>
                <input
                  type="radio"
                  checked={audienceMode === "selected"}
                  onChange={() => {
                    setAudienceMode("selected");
                    setForm((prev) => ({
                      ...prev,
                      targetRoles: prev.targetRoles.length > 0 ? prev.targetRoles : ["job_seeker"],
                    }));
                  }}
                />
                Selected actors
              </label>
            </div>
            <div className="dash-role-checkboxes">
              {ROLE_OPTIONS.map((option) => (
                <label key={option.value} className="dash-role-checkbox">
                  <input
                    type="checkbox"
                    checked={form.targetRoles.includes(option.value)}
                    disabled={audienceMode === "all"}
                    onChange={() => toggleRole(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Notification" : "Create Notification"}
            </button>
            {editingId ? (
              <button className="btn secondary-btn" type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h2>Existing Notifications</h2>
        </div>
        {notifications.length === 0 ? (
          <p className="dash-muted">No notifications created yet.</p>
        ) : (
          <div className="dash-list">
            {notifications.map((item) => (
              <div key={item._id} className="dash-list-item">
                <div className="dash-avatar">{item.title?.[0]?.toUpperCase() || "N"}</div>
                <div className="dash-list-main">
                  <p className="dash-list-title">{item.title}</p>
                  <p className="dash-muted">{item.message}</p>
                  <p className="dash-muted">
                    Targets:{" "}
                    {(item.targetRoles || [])
                      .map((role) => role.replace("_", " "))
                      .join(", ")}
                  </p>
                  <p className="dash-muted">
                    Reach: {item.acknowledgedCount || 0}/{item.totalRecipients || 0} acknowledged (
                    {item.acknowledgementRate || 0}%)
                  </p>
                </div>
                <div className="dash-action-col">
                  <button className="btn small-btn" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button className="btn danger small-btn" onClick={() => handleDelete(item._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
