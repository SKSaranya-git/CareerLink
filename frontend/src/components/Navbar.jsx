import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import logo from "../assets/careerlink-logo.svg";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notifWrapRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    let mounted = true;
    async function loadNotifications() {
      if (!user) return;
      setNotifLoading(true);
      try {
        const { data } = await api.get("/notifications/me");
        if (mounted) {
          const items = data.notifications || [];
          const unread = items.filter((item) => !item.acknowledged).length;
          setNotifications(items);
          setUnreadCount(unread);
          setNotifError("");
        }
      } catch (error) {
        if (mounted) {
          setNotifError(error.response?.data?.message || "Failed to load notifications.");
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (mounted) setNotifLoading(false);
      }
    }

    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 20000);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }

    setUnreadCount(0);
    setNotifications([]);
    setNotifError("");
    setNotificationsOpen(false);
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!notifWrapRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    if (!notificationsOpen) return undefined;
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notificationsOpen]);

  async function acknowledgeNotification(notificationId) {
    try {
      await api.post(`/notifications/${notificationId}/acknowledge`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, acknowledged: true, acknowledgedAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      setNotifError(error.response?.data?.message || "Failed to acknowledge notification.");
    }
  }

  return (
    <header className="navbar">
      <div className="brand">
        <Link to="/" className="brand-link">
          <img src={logo} alt="CareerLink logo" className="brand-logo" />
          <span>CareerLink</span>
        </Link>
      </div>

      <nav className="nav-links">
        {!user ? (
          <>
            <Link to="/">Home</Link>
            <a href="/#about">About</a>
            <a href="/#contact">Contact</a>
            <Link to="/jobs">Jobs</Link>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn small-btn">
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard/profile">Profile</Link>
            <div className="nav-notif-wrap" ref={notifWrapRef}>
              <button
                type="button"
                className="nav-notif-trigger"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Open notifications"
              >
                <span>Notifications</span>
                {unreadCount > 0 ? <span className="nav-notif-count">{unreadCount}</span> : null}
              </button>
              {notificationsOpen ? (
                <div className="nav-notif-panel">
                  <div className="dash-notif-panel-head">
                    <p className="dash-list-title">Notifications</p>
                    <button
                      className="dash-link-inline"
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                  {notifError ? <p className="error">{notifError}</p> : null}
                  {notifLoading ? <p className="dash-muted">Loading...</p> : null}
                  {!notifLoading && notifications.length === 0 ? (
                    <p className="dash-muted">No notifications for you.</p>
                  ) : (
                    <div className="dash-notif-list">
                      {notifications.slice(0, 8).map((notification) => (
                        <div key={notification._id} className="dash-notif-item">
                          <p className="dash-list-title">{notification.title}</p>
                          <p className="dash-muted">{notification.message}</p>
                          <p className="dash-muted">
                            {notification.createdAt
                              ? new Date(notification.createdAt).toLocaleString()
                              : ""}
                          </p>
                          {notification.acknowledged ? (
                            <p className="dash-muted">Acknowledged</p>
                          ) : (
                            <button
                              className="btn secondary-btn small-btn"
                              type="button"
                              onClick={() => acknowledgeNotification(notification._id)}
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <button className="btn danger small-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
