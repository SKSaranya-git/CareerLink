import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();
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

  const crumbs = useMemo(() => {
    const roleLabelMap = {
      admin: "Admin",
      employer: "Employer",
      job_seeker: "Job Seeker",
    };
    const roleLabel = roleLabelMap[user?.role] || "User";
    const path = location.pathname;

    if (path === "/dashboard") return ["CareerLink", roleLabel, "Dashboard"];
    if (path === "/dashboard/profile") return ["CareerLink", roleLabel, "Public Profile"];
    if (path === "/dashboard/settings") return ["CareerLink", roleLabel, "Settings"];
    if (path === "/dashboard/my-jobs") return ["CareerLink", "Employer", "My Jobs"];
    if (path === "/dashboard/post-job") return ["CareerLink", "Employer", "Post a Job"];
    if (path === "/dashboard/shortlisted") return ["CareerLink", "Employer", "Shortlisted"];
    if (path.startsWith("/dashboard/job/") && path.endsWith("/applications")) {
      return ["CareerLink", "Employer", "Job Applications"];
    }
    if (path.startsWith("/dashboard/applicant/")) {
      return ["CareerLink", "Employer", "Applicant Profile"];
    }
    if (path.startsWith("/dashboard/schedule-interview/")) {
      return ["CareerLink", "Employer", "Schedule Interview"];
    }
    if (path === "/dashboard/my-applications") {
      return ["CareerLink", "Job Seeker", "My Applications"];
    }
    if (path === "/dashboard/jobs") {
      return ["CareerLink", "Job Seeker", "Jobs"];
    }
    if (path.startsWith("/dashboard/employer/")) {
      return ["CareerLink", "Job Seeker", "Company Profile"];
    }
    if (path === "/dashboard/analytics-notifications") {
      return ["CareerLink", "Admin", "Analytics & Notifications"];
    }
    if (path === "/dashboard/approvals") return ["CareerLink", "Admin", "Approvals"];

    return ["CareerLink", roleLabel, "Dashboard"];
  }, [location.pathname, user?.role]);

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
            <p className="dash-user-name">{user?.name || "User"}</p>
            <p className="dash-sub">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>

        <div className="dash-nav">
          <p className="dash-nav-title">Overview</p>
          <SidebarLink to="/dashboard" label="Dashboard" />
          <SidebarLink to="/dashboard/settings" label="Settings" />

          {user?.role === "admin" && (
            <>
              <p className="dash-nav-title">Admin</p>
              <SidebarLink to="/dashboard/analytics-notifications" label="Analytics & Notifications" />
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
              <SidebarLink to="/dashboard/jobs" label="Jobs" />
              <SidebarLink to="/dashboard/my-applications" label="My Applications" />
            </>
          )}
        </div>
      </aside>

      <section className="dash-main">
        <header className="dash-topbar">
          <div className="dash-crumbs">{crumbs.join(" / ")}</div>
        </header>
        <div className="dash-content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}

