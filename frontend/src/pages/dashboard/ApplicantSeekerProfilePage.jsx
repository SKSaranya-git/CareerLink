import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

function initials(name) {
  const safe = (name || "").trim();
  if (!safe) return "U";
  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function ApplicantSeekerProfilePage() {
  const { seekerId } = useParams();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId") || "";
  const jobId = searchParams.get("jobId") || "";
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const serverBase = useMemo(() => {
    try {
      return new URL(apiBase).origin;
    } catch {
      return "http://localhost:5000";
    }
  }, [apiBase]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = applicationId ? `?applicationId=${encodeURIComponent(applicationId)}` : "";
      const { data } = await api.get(`/users/public/seeker/${seekerId}${q}`);
      setUser(data.user);
      setApplication(data.application || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load candidate profile.");
      setUser(null);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [seekerId, applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const resumeHref = (resume) => {
    if (!resume) return "";
    if (resume.startsWith("http")) return resume;
    return `${serverBase}${resume}`;
  };

  const publicImageUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${serverBase}${user.profileImage}`
    : "";

  const skillsText = Array.isArray(user?.skills) ? user.skills.filter(Boolean).join(", ") : "";

  const backHref = jobId ? `/dashboard/job/${jobId}/applications` : "/dashboard/my-jobs";

  const updateStatus = async (status) => {
    if (!application?._id) return;
    setActionBusy(true);
    setActionMsg("");
    try {
      const { data } = await api.patch(`/applications/${application._id}/status`, { status });
      setActionMsg(data.message || "Updated.");
      await load();
      if (status === "shortlisted" || status === "rejected") {
        navigate(backHref);
      }
    } catch (err) {
      setActionMsg(err.response?.data?.message || "Could not update status.");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="applicant-seeker-shell">
        <p className="dash-muted">Loading candidate profile…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="applicant-seeker-shell">
        <div className="dash-panel">
          <p className="error">{error || "Profile not found."}</p>
          <Link className="dash-link-inline" to={backHref}>
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  const eduHeadline = user.educationLevel || "Job seeker";
  const orgLine = [user.university, user.location].filter(Boolean).join(" • ");

  return (
    <div className="applicant-seeker-shell profile-public-modern">
      {actionMsg ? <p className="dash-muted">{actionMsg}</p> : null}

      <section className="dash-panel profile-public-banner applicant-seeker-banner">
        <div className="profile-public-banner-left">
          <div className="profile-public-avatar-wrap">
            {publicImageUrl ? (
              <img
                className="avatar profile-public-avatar"
                src={publicImageUrl}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="profile-public-avatar-fallback">{initials(user.name)}</div>
            )}
          </div>
          <div>
            <div className="profile-public-name-row">
              <h1 className="dash-title">{user.name || "Candidate"}</h1>
              <span className="applicant-seeker-pill">Applicant</span>
            </div>
            <p className="dash-muted profile-public-subline">{eduHeadline}</p>
            <p className="dash-muted">{orgLine || "—"}</p>
            {application?.job?.title ? (
              <p className="dash-muted applicant-seeker-applied-for">
                Applied for: <strong>{application.job.title}</strong>
                {application.appliedAt ? ` · ${new Date(application.appliedAt).toLocaleDateString()}` : ""}
              </p>
            ) : null}
          </div>
        </div>
        <div className="applicant-seeker-banner-actions">
          {application?.resume ? (
            <a className="btn small-btn" href={resumeHref(application.resume)} target="_blank" rel="noreferrer">
              Download resume
            </a>
          ) : (
            <button type="button" className="btn secondary-btn small-btn" disabled>
              No resume on file
            </button>
          )}
          {application?.status === "pending" ? (
            <>
              <button
                type="button"
                className="btn small-btn"
                disabled={actionBusy}
                onClick={() => updateStatus("shortlisted")}
              >
                Shortlist
              </button>
              <button
                type="button"
                className="btn danger small-btn"
                disabled={actionBusy}
                onClick={() => updateStatus("rejected")}
              >
                Reject
              </button>
            </>
          ) : null}
          {application?.status === "shortlisted" ? (
            <Link className="btn small-btn" to={`/dashboard/schedule-interview/${application._id}`}>
              Schedule interview
            </Link>
          ) : null}
          <Link className="btn secondary-btn small-btn" to={backHref}>
            Back to list
          </Link>
        </div>
      </section>

      <div className="profile-public-layout">
        <div className="profile-public-main">
          <section className="dash-panel profile-public-card">
            <div className="dash-panel-head">
              <h2>About {user.name?.split(" ")?.[0] || "candidate"}</h2>
            </div>
            <p className="dash-muted">{user.bio?.trim() || "No summary provided."}</p>
          </section>

          {application?.coverLetter?.trim() ? (
            <section className="dash-panel profile-public-card">
              <div className="dash-panel-head">
                <h2>Cover letter (this application)</h2>
              </div>
              <p className="dash-muted applicant-seeker-cover">{application.coverLetter}</p>
            </section>
          ) : null}

          <section className="dash-panel profile-public-card">
            <div className="dash-panel-head">
              <h2>Education & skills</h2>
            </div>
            <div className="applicant-seeker-detail-grid">
              <div>
                <p className="dash-muted">Education level</p>
                <p>{user.educationLevel || "—"}</p>
              </div>
              <div>
                <p className="dash-muted">University / school</p>
                <p>{user.university || "—"}</p>
              </div>
              <div>
                <p className="dash-muted">Graduation year</p>
                <p>{user.graduationYear != null ? String(user.graduationYear) : "—"}</p>
              </div>
              <div className="span-2">
                <p className="dash-muted">Skills</p>
                <p>{skillsText || "—"}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="profile-public-side">
          <section className="dash-panel profile-public-card">
            <div className="dash-panel-head">
              <h2>Application status</h2>
            </div>
            <p>
              <span className="app-status-chip">{application?.status || "—"}</span>
            </p>
          </section>

          <section className="dash-panel profile-public-contact-card">
            <h3>Contact</h3>
            <div className="profile-public-side-row">
              <span>Email</span>
              <span>{user.email || "—"}</span>
            </div>
            <div className="profile-public-side-row">
              <span>Phone</span>
              <span>{user.contactNumber || "—"}</span>
            </div>
          </section>

          <section className="dash-panel profile-public-card">
            <div className="dash-panel-head">
              <h2>Links</h2>
            </div>
            <div className="profile-public-grid">
              <div className="span-2">
                <p className="dash-muted">LinkedIn</p>
                <p>
                  {user.linkedinUrl ? (
                    <a
                      href={user.linkedinUrl.startsWith("http") ? user.linkedinUrl : `https://${user.linkedinUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dash-link-inline"
                    >
                      {user.linkedinUrl}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className="span-2">
                <p className="dash-muted">Portfolio</p>
                <p>
                  {user.portfolioUrl ? (
                    <a
                      href={user.portfolioUrl.startsWith("http") ? user.portfolioUrl : `https://${user.portfolioUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dash-link-inline"
                    >
                      {user.portfolioUrl}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
