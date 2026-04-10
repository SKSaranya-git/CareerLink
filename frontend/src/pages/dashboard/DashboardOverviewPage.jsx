import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function titleCaseEmploymentType(value) {
  if (value == null || (Array.isArray(value) && value.length === 0)) return "-";
  const items = Array.isArray(value) ? value : [value];
  return items
    .map((t) =>
      String(t)
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    )
    .join(", ");
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState(null);
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [seekerApplications, setSeekerApplications] = useState([]);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [employerApplications, setEmployerApplications] = useState([]);
  const [employerInterviews, setEmployerInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = useMemo(() => new Date().toLocaleDateString(), []);
  const firstName = useMemo(() => user?.name?.split(" ")?.[0] || "there", [user?.name]);

  useEffect(() => {
    async function load() {
      setError("");
      setLoading(true);
      try {
        if (user?.role === "admin") {
          const [overviewRes, pendingRes] = await Promise.all([
            api.get("/admin/overview"),
            api.get("/admin/pending-employers"),
          ]);
          setAdminStats(overviewRes.data.stats);
          setPendingEmployers(pendingRes.data.pendingEmployers || []);
          setSeekerApplications([]);
          setEmployerJobs([]);
          setEmployerApplications([]);
          setEmployerInterviews([]);
        } else if (user?.role === "job_seeker") {
          const { data } = await api.get("/applications/my-applications");
          setSeekerApplications(data.applications || []);
          setAdminStats(null);
          setPendingEmployers([]);
          setEmployerJobs([]);
          setEmployerApplications([]);
          setEmployerInterviews([]);
        } else if (user?.role === "employer") {
          const [jobsRes, interviewsRes] = await Promise.all([
            api.get("/jobs/my-jobs"),
            api.get("/interviews"),
          ]);
          const jobs = jobsRes.data.jobs || [];
          setEmployerJobs(jobs);
          setEmployerInterviews(interviewsRes.data.interviews || []);
          if (jobs.length) {
            const jobAppsResponses = await Promise.all(
              jobs.map((job) => api.get(`/applications/job/${job._id}`))
            );
            const allApplications = jobAppsResponses.flatMap((res) => res.data.applications || []);
            setEmployerApplications(allApplications);
          } else {
            setEmployerApplications([]);
          }
          setAdminStats(null);
          setPendingEmployers([]);
          setSeekerApplications([]);
        } else {
          setAdminStats(null);
          setPendingEmployers([]);
          setSeekerApplications([]);
          setEmployerJobs([]);
          setEmployerApplications([]);
          setEmployerInterviews([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    if (user) load();
  }, [user]);

  if (error) return <p className="error">{error}</p>;

  if (loading) return <p className="dash-muted">Loading dashboard...</p>;

  if (user?.role === "job_seeker") {
    const sortedApps = [...seekerApplications].sort(
      (a, b) => new Date(b.appliedAt || b.createdAt || 0) - new Date(a.appliedAt || a.createdAt || 0)
    );
    const totalApplied = sortedApps.length;
    const reviewing = sortedApps.filter((app) => app.status === "pending").length;
    const shortlisted = sortedApps.filter((app) => app.status === "shortlisted").length;
    const rejected = sortedApps.filter((app) => app.status === "rejected").length;
    const profileFields = [
      user?.name,
      user?.email,
      user?.contactNumber,
      user?.location,
      user?.educationLevel,
      user?.university,
      user?.bio,
    ];
    const profileCompletion = Math.round(
      (profileFields.filter((value) => Boolean(String(value || "").trim())).length / profileFields.length) * 100
    );

    return (
      <div className="overview-shell">
        <section className="dash-panel overview-hero">
          <h1>Welcome back, {firstName}!</h1>
          <p className="dash-muted">Track your progress, review application statuses, and discover your next role.</p>
          <div className="overview-hero-actions">
            <Link className="btn overview-hero-btn" to="/dashboard/jobs">
              Review Job Picks
            </Link>
          </div>
        </section>

        <div className="overview-stat-grid">
          <article className="overview-stat-card">
            <p className="dash-muted">Total Applied</p>
            <p className="overview-stat-value">{totalApplied}</p>
          </article>
          <article className="overview-stat-card">
            <p className="dash-muted">Reviewing</p>
            <p className="overview-stat-value">{reviewing}</p>
          </article>
          <article className="overview-stat-card">
            <p className="dash-muted">Interview Stage</p>
            <p className="overview-stat-value">{shortlisted}</p>
          </article>
          <article className="overview-stat-card">
            <p className="dash-muted">Profile Status</p>
            <p className="overview-stat-value">{profileCompletion}%</p>
          </article>
        </div>

        <div className="overview-grid">
          <section className="dash-panel overview-main-panel">
            <div className="dash-panel-head">
              <h2>Recent Applications</h2>
              <Link className="dash-link-inline" to="/dashboard/my-applications">
                View all history →
              </Link>
            </div>
            {sortedApps.length === 0 ? (
              <p className="dash-muted">You have not applied yet. Start exploring jobs to build momentum.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedApps.slice(0, 6).map((app) => (
                      <tr key={app._id}>
                        <td>{app.job?.employer?.companyName || app.job?.employer?.name || "-"}</td>
                        <td>{app.job?.title || "-"}</td>
                        <td>
                          <span className="app-status-chip">{app.status || "-"}</span>
                        </td>
                        <td>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="dash-panel overview-side-panel">
            <h3>Quick Actions</h3>
            <div className="overview-action-list">
              <Link to="/dashboard/jobs" className="overview-action-item">
                Search Jobs
              </Link>
              <Link to="/dashboard/my-applications" className="overview-action-item">
                My Applications
              </Link>
              <Link to="/dashboard/settings" className="overview-action-item">
                Complete Profile
              </Link>
            </div>
            <div className="overview-side-metric">
              <p className="dash-muted">Declined</p>
              <p className="overview-side-value">{rejected}</p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (user?.role === "employer") {
    const postedThisMonth = employerJobs.filter((job) => {
      const createdAt = new Date(job.createdAt);
      const now = new Date();
      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length;
    const totalApplicants = employerApplications.length;
    const shortlistedCount = employerApplications.filter((app) => app.status === "shortlisted").length;
    const hiredCount = employerApplications.filter((app) => app.status === "hired").length;
    const rejectedCount = employerApplications.filter((app) => app.status === "rejected").length;
    const pendingCount = employerApplications.filter((app) => app.status === "pending").length;
    const interviewsScheduled = employerInterviews.filter((item) => item.status === "scheduled").length;

    const recentApplications = [...employerApplications]
      .sort(
        (a, b) =>
          new Date(b.appliedAt || b.createdAt || 0).getTime() -
          new Date(a.appliedAt || a.createdAt || 0).getTime()
      )
      .slice(0, 6);

    const topJobsByApplications = employerJobs
      .map((job) => ({
        ...job,
        applicationsCount: employerApplications.filter(
          (app) =>
            (typeof app.job === "string" ? app.job : app.job?._id)?.toString() === job._id.toString()
        ).length,
      }))
      .sort((a, b) => b.applicationsCount - a.applicationsCount)
      .slice(0, 5);

    return (
      <div className="overview-shell">
        <section className="dash-panel overview-hero">
          <h1>Welcome back, {firstName}!</h1>
          <p className="dash-muted">
            Company hiring dashboard with pipeline visibility, candidate activity, and interview tracking.
          </p>
          <div className="overview-hero-actions">
            <Link className="btn overview-hero-btn" to="/dashboard/post-job">
              Post a Job
            </Link>
          </div>
        </section>

        <div className="overview-stat-grid">
          <article className="overview-stat-card">
            <p className="dash-muted">Total Listings</p>
            <p className="overview-stat-value">{employerJobs.length}</p>
          </article>
          <article className="overview-stat-card">
            <p className="dash-muted">Total Applicants</p>
            <p className="overview-stat-value">{totalApplicants}</p>
          </article>
          <article className="overview-stat-card">
            <p className="dash-muted">Interviews Scheduled</p>
            <p className="overview-stat-value">{interviewsScheduled}</p>
          </article>
          <article className="overview-stat-card">
            <p className="dash-muted">Posted This Month</p>
            <p className="overview-stat-value">
              {postedThisMonth}
            </p>
          </article>
        </div>

        <div className="overview-grid">
          <section className="dash-panel overview-main-panel">
            <div className="dash-panel-head">
              <h2>Hiring Pipeline</h2>
              <Link className="dash-link-inline" to="/dashboard/shortlisted">
                Open shortlist →
              </Link>
            </div>
            <div className="dist-wrap">
              <div className="dist-row">
                <p className="dist-label">Pending review ({pendingCount})</p>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round((pendingCount / Math.max(totalApplicants, 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="dist-row">
                <p className="dist-label">Shortlisted ({shortlistedCount})</p>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round((shortlistedCount / Math.max(totalApplicants, 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="dist-row">
                <p className="dist-label">Hired ({hiredCount})</p>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round((hiredCount / Math.max(totalApplicants, 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="dist-row">
                <p className="dist-label">Rejected ({rejectedCount})</p>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill status"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round((rejectedCount / Math.max(totalApplicants, 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <aside className="dash-panel overview-side-panel">
            <h3>Top Performing Roles</h3>
            {topJobsByApplications.length === 0 ? (
              <p className="dash-muted">No role data yet.</p>
            ) : (
              <div className="overview-action-list">
                {topJobsByApplications.map((job) => (
                  <div key={job._id} className="overview-action-item">
                    <p className="dash-list-title">{job.title}</p>
                    <p className="dash-muted">
                      {titleCaseEmploymentType(job.employmentType)} • {job.location || "-"}
                    </p>
                    <p className="dash-muted">{job.applicationsCount} application(s)</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        <section className="dash-panel overview-main-panel">
          <div className="dash-panel-head">
            <h2>Recent Candidate Activity</h2>
            <Link className="dash-link-inline" to="/dashboard/my-jobs">
              View all jobs →
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <p className="dash-muted">No applicant activity yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app._id}>
                      <td>{app.fullName || app.applicant?.name || "-"}</td>
                      <td>{app.job?.title || "-"}</td>
                      <td>
                        <span className="app-status-chip">{app.status || "-"}</span>
                      </td>
                      <td>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        {app.job?._id ? (
                          <Link className="dash-link-inline" to={`/dashboard/job/${app.job._id}/applications`}>
                            Open job applicants
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

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
          <p className="dash-stat-value">{adminStats?.usersCount ?? "-"}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Active Jobs</p>
          <p className="dash-stat-value">{adminStats?.jobsCount ?? "-"}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Applications</p>
          <p className="dash-stat-value">{adminStats?.applicationsCount ?? "-"}</p>
        </div>
        <div className="dash-stat">
          <p className="dash-stat-label">Pending Approvals</p>
          <p className="dash-stat-value">{adminStats?.pendingEmployers ?? "-"}</p>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h2>Employer Approvals</h2>
          <Link className="dash-link-inline" to="/dashboard/approvals">
            View all →
          </Link>
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

