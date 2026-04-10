import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import EditJobModal from "../../components/dashboard/EditJobModal";

function formatEmploymentType(type) {
  if (type == null || (Array.isArray(type) && type.length === 0)) return "-";
  const items = Array.isArray(type) ? type : [type];
  return items
    .map((t) =>
      String(t)
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    )
    .join(", ");
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRelativePostedDate(dateValue) {
  if (!dateValue) return "-";
  const postedDate = new Date(dateValue);
  if (Number.isNaN(postedDate.getTime())) return "-";

  const now = new Date();
  const diffMs = now.getTime() - postedDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(0, Math.floor(diffMs / dayMs));

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export default function EmployerMyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [applicationsByJob, setApplicationsByJob] = useState({});
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  useEffect(() => {
    async function load() {
      setError("");
      setLoading(true);
      try {
        const [jobsRes, interviewsRes] = await Promise.all([
          api.get("/jobs/my-jobs"),
          api.get("/interviews"),
        ]);
        const myJobs = jobsRes.data.jobs || [];
        setJobs(myJobs);
        setInterviews(interviewsRes.data.interviews || []);

        if (!myJobs.length) {
          setApplicationsByJob({});
          return;
        }

        const responses = await Promise.allSettled(
          myJobs.map((job) => api.get(`/applications/job/${job._id}`))
        );
        const nextMap = {};
        myJobs.forEach((job, idx) => {
          const result = responses[idx];
          nextMap[job._id] =
            result.status === "fulfilled" ? result.value.data.applications || [] : [];
        });
        setApplicationsByJob(nextMap);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your jobs.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const overview = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const postedThisMonth = jobs.filter((job) => {
      const createdDate = new Date(job.createdAt);
      return (
        !Number.isNaN(createdDate.getTime()) &&
        createdDate.getMonth() === month &&
        createdDate.getFullYear() === year
      );
    }).length;

    const uniqueLocations = new Set(
      jobs
        .map((job) => (job.location || "").trim().toLowerCase())
        .filter(Boolean)
    ).size;

    const allApplications = Object.values(applicationsByJob).flat();
    const monthlyApplications = allApplications.filter((app) => {
      if (!app.appliedAt) return false;
      const applied = new Date(app.appliedAt);
      return (
        !Number.isNaN(applied.getTime()) &&
        applied.getMonth() === month &&
        applied.getFullYear() === year
      );
    }).length;

    const scheduledInterviews = interviews.filter((item) => {
      if (!item.startsAt) return false;
      const startsAt = new Date(item.startsAt);
      return (
        !Number.isNaN(startsAt.getTime()) &&
        startsAt.getMonth() === month &&
        startsAt.getFullYear() === year &&
        item.status === "scheduled"
      );
    }).length;

    const hiredCount = allApplications.filter((app) => app.status === "hired").length;

    const salaries = jobs
      .map((job) => Number(job.salary))
      .filter((value) => Number.isFinite(value));
    const avgSalary = salaries.length
      ? Math.round(
          salaries.reduce((total, value) => total + value, 0) / salaries.length
        )
      : null;

    return {
      totalListings: jobs.length,
      monthlyApplications,
      uniqueLocations,
      scheduledInterviews,
      averageSalary: avgSalary,
      allApplications,
      postedThisMonth,
      hiredCount,
    };
  }, [jobs, applicationsByJob, interviews]);

  const postingTrend = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();
    const monthKeys = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthKeys.push({
        key,
        label: monthFormatter.format(date),
      });
    }

    const countsByMonth = jobs.reduce((acc, job) => {
      const date = new Date(job.createdAt);
      if (Number.isNaN(date.getTime())) return acc;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return monthKeys.map(({ key, label }) => ({
      label,
      count: countsByMonth[key] || 0,
    }));
  }, [jobs]);

  const highestTrendValue = useMemo(
    () => Math.max(...postingTrend.map((entry) => entry.count), 1),
    [postingTrend]
  );

  const todayInterviews = useMemo(() => {
    const today = new Date();
    return interviews
      .filter((item) => item.status === "scheduled" && item.startsAt)
      .filter((item) => isSameDay(new Date(item.startsAt), today))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 5);
  }, [interviews]);

  const avgApplicationsPerJob = useMemo(() => {
    if (!jobs.length) return 0;
    return Math.round((overview.allApplications.length / jobs.length) * 10) / 10;
  }, [overview.allApplications.length, jobs.length]);

  const jobsWithApplicants = useMemo(
    () =>
      jobs.filter((job) => (applicationsByJob[job._id] || []).length > 0).length,
    [jobs, applicationsByJob]
  );

  const typeOptions = useMemo(() => {
    const types = new Set();
    jobs.forEach((job) => {
      const values = Array.isArray(job.employmentType)
        ? job.employmentType
        : job.employmentType
          ? [job.employmentType]
          : [];
      values.forEach((type) => types.add(String(type).trim().toLowerCase()));
    });
    return Array.from(types).filter(Boolean).sort();
  }, [jobs]);

  const locationOptions = useMemo(() => {
    const locations = new Set(
      jobs
        .map((job) => String(job.location || "").trim())
        .filter(Boolean)
    );
    return Array.from(locations).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const keyword = jobSearch.trim().toLowerCase();
    return jobs.filter((job) => {
      const normalizedTypes = Array.isArray(job.employmentType)
        ? job.employmentType.map((type) => String(type).trim().toLowerCase())
        : job.employmentType
          ? [String(job.employmentType).trim().toLowerCase()]
          : [];

      const matchesKeyword =
        keyword.length === 0 ||
        [job.title, job.location, job.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesType = typeFilter === "all" || normalizedTypes.includes(typeFilter);
      const matchesLocation =
        locationFilter === "all" || String(job.location || "").trim() === locationFilter;

      return matchesKeyword && matchesType && matchesLocation;
    });
  }, [jobs, jobSearch, typeFilter, locationFilter]);

  const handleJobUpdated = (updatedJob) => {
    setJobs((prev) => prev.map((job) => (job._id === updatedJob._id ? updatedJob : job)));
    setMessage("Job updated successfully.");
    setError("");
  };

  const handleDeleteJob = async (job) => {
    const confirmed = window.confirm(`Delete \"${job.title}\"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingJobId(job._id);
    setError("");
    setMessage("");

    try {
      await api.delete(`/jobs/${job._id}`);
      setJobs((prev) => prev.filter((item) => item._id !== job._id));
      setApplicationsByJob((prev) => {
        const next = { ...prev };
        delete next[job._id];
        return next;
      });
      setInterviews((prev) => prev.filter((item) => item?.job?._id !== job._id));
      setMessage("Job deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete the job.");
    } finally {
      setDeletingJobId("");
    }
  };

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <div>
          <p className="dash-muted employer-jobs-kicker">Employer Workspace</p>
          <h2>Analytics</h2>
          <p className="dash-muted">
            Build great teams, track hiring progress, and keep every opportunity moving.
          </p>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
  {message ? <p className="dash-success">{message}</p> : null}
      {loading ? <p className="dash-muted">Loading jobs dashboard...</p> : null}

      {!loading && jobs.length === 0 ? (
        <p className="dash-muted">No jobs posted yet.</p>
      ) : (
        <div className="employer-jobs-layout">
          <div className="employer-jobs-stats">
            <article className="employer-jobs-stat-card">
              <p className="employer-jobs-stat-label">Total Listings</p>
              <p className="employer-jobs-stat-value">{overview.totalListings}</p>
            </article>
            <article className="employer-jobs-stat-card">
              <p className="employer-jobs-stat-label">Monthly Applications</p>
              <p className="employer-jobs-stat-value">{overview.monthlyApplications}</p>
            </article>
            <article className="employer-jobs-stat-card">
              <p className="employer-jobs-stat-label">Scheduled Interviews</p>
              <p className="employer-jobs-stat-value">{overview.scheduledInterviews}</p>
            </article>
            <article className="employer-jobs-stat-card">
              <p className="employer-jobs-stat-label">Average Salary</p>
              <p className="employer-jobs-stat-value">
                {formatCurrency(overview.averageSalary)}
              </p>
            </article>
          </div>

          <div className="employer-jobs-main-bottom">
                <section className="employer-jobs-sub-panel employer-jobs-insight-panel">
                  <p className="dash-muted employer-jobs-insight-kicker">Analytics Insight</p>
                  <h3>Hiring performance snapshot</h3>
                  <p className="dash-muted">
                    Avg. applications per listing: <strong>{avgApplicationsPerJob}</strong>
                  </p>
                  <p className="dash-muted">
                    Hired candidates: <strong>{overview.hiredCount}</strong>
                  </p>
                  <p className="dash-muted">
                    Listings with applicants: <strong>{jobsWithApplicants}</strong> / {jobs.length}
                  </p>
                  <p className="dash-muted">
                    Avg salary benchmark: <strong>{formatCurrency(overview.averageSalary)}</strong>
                  </p>
                </section>
              </div>

          <div className="employer-jobs-bottom-grid">
            <section className="dash-panel employer-jobs-inner-panel">
              <div className="dash-panel-head">
                <h3>Posting Trend (Last 6 Months)</h3>
              </div>
              <div className="employer-jobs-trend">
                {postingTrend.map((item) => {
                  const height = (item.count / highestTrendValue) * 100;
                  return (
                    <div className="employer-jobs-trend-item" key={item.label}>
                      <div className="employer-jobs-trend-track">
                        <div
                          className="employer-jobs-trend-bar"
                          style={{ height: `${Math.max(height, 8)}%` }}
                          title={`${item.count} jobs`}
                        />
                      </div>
                      <span className="employer-jobs-trend-count">{item.count}</span>
                      <span className="employer-jobs-trend-label">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="dash-panel employer-jobs-inner-panel">
              <div className="dash-panel-head">
                <h3>Recent Job Activity</h3>
              </div>
              <div className="employer-jobs-activity-list">
                {jobs.slice(0, 4).map((job) => (
                  <article className="employer-jobs-activity-item" key={job._id}>
                    <div>
                      <p className="employer-jobs-activity-title">{job.title}</p>
                      <p className="dash-muted">
                        {job.location || "Location not set"} •{" "}
                        {formatEmploymentType(job.employmentType)} •{" "}
                        {formatRelativePostedDate(job.createdAt)}
                      </p>
                    </div>
                    <Link
                      className="dash-link-inline"
                      to={`/dashboard/job/${job._id}/applications`}
                    >
                      View Applications
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {editingJob ? (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onUpdated={handleJobUpdated}
        />
      ) : null}
    </div>
  );
}

