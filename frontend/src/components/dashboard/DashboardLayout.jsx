import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => (isActive ? "dash-link active" : "dash-link")}
    >
      {label}
    </NavLink>
  );
}

export default function DashboardLayout() {
  const { user } = useAuth();
  const [badgeImgError, setBadgeImgError] = useState(false);
  const [myNotifications, setMyNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const serverBase = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    try {
      return new URL(apiBase).origin;
    } catch {
      return "http://localhost:5000";
    }
  }, []);

  const badgeImageUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${serverBase}${user.profileImage}?v=${user.updatedAt || Date.now()}`
    : "";

  useEffect(() => {
    // If user uploads a new photo, retry showing it.
    setBadgeImgError(false);
  }, [user?.profileImage]);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      try {
        const { data } = await api.get("/notifications/my");
        if (!mounted) return;
        setMyNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        if (!mounted) return;
        setMyNotifications([]);
        setUnreadCount(0);
      }
    }

    if (user) {
      loadNotifications();
      const intervalId = setInterval(loadNotifications, 15000);
      return () => {
        mounted = false;
        clearInterval(intervalId);
      };
    }

    return undefined;
  }, [user]);

  async function acknowledgeNotification(id) {
    try {
      await api.patch(`/notifications/${id}/acknowledge`);
      const { data } = await api.get("/notifications/my");
      setMyNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Keep UI stable even if acknowledge fails.
    }
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-header">
          <div className={`dash-badge ${badgeImageUrl && !badgeImgError ? "has-image" : ""}`}>
            {badgeImageUrl && !badgeImgError ? (
              <img
                src={badgeImageUrl}
                alt="profile"
                onError={() => setBadgeImgError(true)}
              />
            ) : (
              (user?.name || "U")[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="dash-app">CareerLink</p>
            <p className="dash-sub">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>

        <div className="dash-nav">
          <p className="dash-nav-title">Overview</p>
          <SidebarLink to="/dashboard" label="Dashboard" />
          <SidebarLink to="/dashboard/profile" label="Profile" />

          {user?.role === "admin" && (
            <>
              <p className="dash-nav-title">Moderation</p>
              <SidebarLink to="/dashboard/analytics" label="Analytics" />
              <SidebarLink to="/dashboard/approvals" label="Approvals" />
              <SidebarLink to="/dashboard/notifications" label="Notification Management" />
            </>
          )}

          {user?.role === "employer" && (
            <>
              <p className="dash-nav-title">Employer</p>
              <SidebarLink to="/dashboard/post-job" label="Post a Job" />
              <SidebarLink to="/dashboard/my-jobs" label="My Jobs" />
              <SidebarLink to="/dashboard/shortlisted" label="Shortlisted" />
            </>
          )}

          {user?.role === "job_seeker" && (
            <>
              <p className="dash-nav-title">Job Seeker</p>
              <SidebarLink to="/dashboard/my-applications" label="My Applications" />
              <SidebarLink to="/dashboard/interviews" label="My Interviews" />
              <SidebarLink to="/dashboard/saved-jobs" label="Saved Jobs" />
            </>
          )}
        </div>
      </aside>

      <section className="dash-main">
        <header className="dash-topbar">
          <div className="dash-crumbs">CareerLink / Dashboard</div>
          <div className="dash-topbar-right">
            <button
              className="dash-bell-btn"
              onClick={() => setShowNotifications((prev) => !prev)}
              type="button"
            >
              <span role="img" aria-label="notifications">
                🔔
              </span>
              {unreadCount > 0 ? <span className="dash-bell-count">{unreadCount}</span> : null}
            </button>
            <div className="dash-pill">{user?.name?.split(" ")?.[0] || "User"}</div>
          </div>
        </header>
        {showNotifications ? (
          <div className="dash-notify-panel">
            <div className="dash-panel-head">
              <h3>Notifications</h3>
            </div>
            {myNotifications.length === 0 ? (
              <p className="dash-muted">No notifications for your role.</p>
            ) : (
              <div className="dash-notify-list">
                {myNotifications.map((item) => (
                  <div
                    key={item._id}
                    className={`dash-notify-item ${item.acknowledged ? "read" : "unread"}`}
                  >
                    <div>
                      <p className="dash-list-title">{item.title}</p>
                      <p className="dash-muted">{item.message}</p>
                    </div>
                    {!item.acknowledged ? (
                      <button
                        className="btn small-btn"
                        type="button"
                        onClick={() => acknowledgeNotification(item._id)}
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="dash-tag">acknowledged</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        <div className="dash-content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}

