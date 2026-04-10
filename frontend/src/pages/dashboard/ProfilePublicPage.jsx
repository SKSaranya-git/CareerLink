import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
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

export default function ProfilePublicPage() {
  const { employerId } = useParams();
  const { user: authUser } = useAuth();
  const isExternalEmployer = Boolean(employerId);

  const [remoteUser, setRemoteUser] = useState(null);
  const [loading, setLoading] = useState(isExternalEmployer);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!employerId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");
      try {
        const { data } = await api.get(`/users/public/employer/${employerId}`);
        if (!cancelled) setRemoteUser(data.user);
      } catch {
        if (!cancelled) {
          setLoadError("This company profile could not be loaded.");
          setRemoteUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employerId]);

  const user = isExternalEmployer ? remoteUser : authUser;
  const isOwnSeeker = !isExternalEmployer && authUser?.role === "job_seeker";
  const isOwnEmployer = !isExternalEmployer && authUser?.role === "employer";

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const serverBase = useMemo(() => {
    try {
      return new URL(apiBase).origin;
    } catch {
      return "http://localhost:5000";
    }
  }, [apiBase]);

  const roleLabel = useMemo(
    () => (user?.role ? user.role.replace("_", " ") : "user"),
    [user?.role]
  );

  const headline = useMemo(() => {
    if (user?.role === "employer") {
      return user?.employmentPosition || "Employer";
    }
    if (user?.role === "job_seeker") {
      return user?.educationLevel || "Job Seeker";
    }
    return "Administrator";
  }, [user?.role, user?.employmentPosition, user?.educationLevel]);

  const companyOrOrg = useMemo(() => {
    if (user?.role === "employer") return user?.companyName || "Company not provided";
    if (user?.role === "job_seeker") return user?.university || "University not provided";
    return "CareerLink Administration";
  }, [user?.role, user?.companyName, user?.university]);

  const publicImageUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${serverBase}${user.profileImage}`
    : "";

  const profileCompletion = useMemo(() => {
    const baseFields = [user?.name, user?.email, user?.contactNumber, user?.bio, user?.location, companyOrOrg, headline];
    const seekerExtra =
      user?.role === "job_seeker"
        ? [Array.isArray(user?.skills) && user.skills.length ? "x" : "", user?.linkedinUrl, user?.portfolioUrl]
        : [];
    const fields = [...baseFields, ...seekerExtra];
    return Math.round(
      (fields.filter((value) => Boolean(String(value || "").trim())).length / fields.length) * 100
    );
  }, [
    user?.name,
    user?.email,
    user?.contactNumber,
    user?.bio,
    user?.location,
    companyOrOrg,
    headline,
    user?.role,
    user?.skills,
    user?.linkedinUrl,
    user?.portfolioUrl,
  ]);

  const skillsPreview = useMemo(() => {
    if (!Array.isArray(user?.skills)) return "";
    return user.skills.filter(Boolean).slice(0, 6).join(", ");
  }, [user?.skills]);

  const jobsLink = authUser?.role === "job_seeker" ? "/dashboard/jobs" : "/jobs";
  const hidePrivateContact = isExternalEmployer;

  if (isExternalEmployer && loading) {
    return (
      <div className="profile-public-shell profile-public-modern">
        <p className="dash-muted">Loading company profile…</p>
      </div>
    );
  }

  if (isExternalEmployer && loadError) {
    return (
      <div className="profile-public-shell profile-public-modern">
        <div className="dash-panel">
          <p className="error">{loadError}</p>
          <Link className="dash-link-inline" to={jobsLink}>
            Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!isExternalEmployer && !authUser) {
    return (
      <div className="profile-public-shell profile-public-modern">
        <p className="dash-muted">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-public-shell profile-public-modern">
      <section className="dash-panel profile-public-banner">
        <div className="profile-public-banner-left">
          <div className="profile-public-avatar-wrap">
            {publicImageUrl ? (
              <img
                className="avatar profile-public-avatar"
                src={publicImageUrl}
                alt="profile"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="profile-public-avatar-fallback">{initials(user?.name)}</div>
            )}
          </div>
          <div>
            <div className="profile-public-name-row">
              <h1 className="dash-title">{user?.name || "User"}</h1>
              {user?.role === "employer" ? (
                <span className="profile-public-verified-pill">Verified Employer</span>
              ) : null}
            </div>
            <p className="dash-muted profile-public-subline">{headline}</p>
            <p className="dash-muted">
              {companyOrOrg} {user?.location ? `• ${user.location}` : ""}
            </p>
          </div>
        </div>
        <div className="profile-public-banner-actions">
          {isExternalEmployer ? (
            <Link className="btn small-btn" to={jobsLink}>
              View openings
            </Link>
          ) : null}
          {isOwnSeeker ? (
            <Link className="btn small-btn" to="/dashboard/jobs">
              Browse jobs
            </Link>
          ) : null}
          {isOwnEmployer ? (
            <Link className="btn small-btn" to="/dashboard/my-jobs">
              My job listings
            </Link>
          ) : null}
        </div>
      </section>

      {!isExternalEmployer && (isOwnSeeker || isOwnEmployer) ? (
        <p className="profile-public-readonly-hint dash-muted">
          This is a read-only preview of your public profile. To change anything, use{" "}
          <Link className="dash-link-inline" to="/dashboard/settings">
            Settings
          </Link>
          .
        </p>
      ) : null}

      <div className="profile-public-layout">
        <div className="profile-public-main">
          <section className="dash-panel profile-public-card">
            <div className="dash-panel-head">
              <h2>About {user?.name?.split(" ")?.[0] || "User"}</h2>
            </div>
            <p className="dash-muted">{user?.bio || "No profile summary added yet."}</p>
          </section>

          <section className="dash-panel profile-public-card">
            <div className="dash-panel-head">
              <h2>Quick Insights</h2>
            </div>
            <div className="profile-public-insight-grid">
              <div>
                <p className="dash-muted">Profile Completion</p>
                <p className="overview-side-value">{profileCompletion}%</p>
              </div>
              <div>
                <p className="dash-muted">Role Type</p>
                <p>{roleLabel}</p>
              </div>
              <div>
                <p className="dash-muted">{isOwnSeeker ? "University / school" : "Organization"}</p>
                <p>{companyOrOrg}</p>
              </div>
              <div>
                <p className="dash-muted">Location</p>
                <p>{user?.location || "Not specified"}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="profile-public-side">
          <section className="dash-panel profile-public-card">
            <div className="dash-panel-head">
              <h2>{isOwnSeeker ? "Education & professional" : "Professional Details"}</h2>
            </div>
            {isOwnSeeker ? (
              <div className="profile-public-grid">
                <div>
                  <p className="dash-muted">Education level</p>
                  <p>{user?.educationLevel || "-"}</p>
                </div>
                <div>
                  <p className="dash-muted">University / school</p>
                  <p>{user?.university || "-"}</p>
                </div>
                <div>
                  <p className="dash-muted">Graduation year</p>
                  <p>{user?.graduationYear != null ? String(user.graduationYear) : "-"}</p>
                </div>
                <div className="span-2">
                  <p className="dash-muted">Skills</p>
                  <p>{skillsPreview || (Array.isArray(user?.skills) && user.skills.length ? user.skills.join(", ") : "—")}</p>
                </div>
                <div>
                  <p className="dash-muted">LinkedIn</p>
                  <p>
                    {user?.linkedinUrl ? (
                      <a
                        href={user.linkedinUrl.startsWith("http") ? user.linkedinUrl : `https://${user.linkedinUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dash-link-inline"
                      >
                        {user.linkedinUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
                <div>
                  <p className="dash-muted">Portfolio</p>
                  <p>
                    {user?.portfolioUrl ? (
                      <a
                        href={user.portfolioUrl.startsWith("http") ? user.portfolioUrl : `https://${user.portfolioUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dash-link-inline"
                      >
                        {user.portfolioUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="profile-public-grid">
                <div>
                  <p className="dash-muted">Current Position</p>
                  <p>{headline || "-"}</p>
                </div>
                <div>
                  <p className="dash-muted">Employee ID</p>
                  <p>{user?.companyEmployeeId || "-"}</p>
                </div>
                <div>
                  <p className="dash-muted">Organization</p>
                  <p>{companyOrOrg || "-"}</p>
                </div>
                <div>
                  <p className="dash-muted">Website</p>
                  <p>
                    {user?.companyWebsite || user?.portfolioUrl ? (
                      <a
                        href={
                          (user.companyWebsite || user.portfolioUrl).startsWith("http")
                            ? user.companyWebsite || user.portfolioUrl
                            : `https://${user.companyWebsite || user.portfolioUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dash-link-inline"
                      >
                        {user.companyWebsite || user.portfolioUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="dash-panel profile-public-contact-card">
            <h3>Direct Contact</h3>
            {hidePrivateContact ? (
              <p className="dash-muted" style={{ marginBottom: "0.75rem" }}>
                Apply to a job to connect with this employer through CareerLink. Email and phone are not shown on public
                profiles.
              </p>
            ) : (
              <>
                <div className="profile-public-side-row">
                  <span>Email</span>
                  <span>{user?.email || "-"}</span>
                </div>
                <div className="profile-public-side-row">
                  <span>Phone Number</span>
                  <span>{user?.contactNumber || "-"}</span>
                </div>
                {!isExternalEmployer ? null : (
                  <button className="btn profile-public-contact-btn" type="button">
                    Send Message
                  </button>
                )}
              </>
            )}
          </section>

          <section className="dash-panel profile-public-map-card">
            <span className="profile-public-map-badge">
              {user?.location ? user.location : "Remote Friendly"}
            </span>
          </section>
        </aside>
      </div>
    </div>
  );
}
