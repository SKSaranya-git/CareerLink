import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

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
              <SidebarLink to="/dashboard/approvals" label="Approvals" />
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
              <SidebarLink to="/dashboard/saved-jobs" label="Saved Jobs" />
            </>
          )}
        </div>
      </aside>

      <section className="dash-main">
        <header className="dash-topbar">
          <div className="dash-crumbs">CareerLink / Dashboard</div>
          <div className="dash-topbar-right">
            <div className="dash-pill">{user?.name?.split(" ")?.[0] || "User"}</div>
          </div>
        </header>
        <div className="dash-content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}

