import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [employerStats, setEmployerStats] = useState({
    activeJobs: 0,
    applicants: 0,
    responseRate: 0,
  });
  const [form, setForm] = useState({
    name: "",
    contactNumber: "",
    bio: "",
    location: "",
    educationLevel: "",
    university: "",
    graduationYear: "",
    skills: "",
    linkedinUrl: "",
    portfolioUrl: "",
    companyName: "",
    employmentPosition: "",
    companyEmployeeId: "",
    companyWebsite: "",
  });

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const serverBase = (() => {
    try {
      return new URL(apiBase).origin;
    } catch (error) {
      return "http://localhost:5000";
    }
  })();

  const profileImageUrl = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${serverBase}${user.profileImage}?v=${user.updatedAt || Date.now()}`
    : "https://via.placeholder.com/120";

  const resetFormFromUser = () => {
    if (!user) return;
    setForm({
      name: user.name || "",
      contactNumber: user.contactNumber || "",
      bio: user.bio || "",
      location: user.location || "",
      educationLevel: user.educationLevel || "",
      university: user.university || "",
      graduationYear: user.graduationYear || "",
      skills: (user.skills || []).join(", "),
      linkedinUrl: user.linkedinUrl || "",
      portfolioUrl: user.portfolioUrl || "",
      companyName: user.companyName || "",
      employmentPosition: user.employmentPosition || "",
      companyEmployeeId: user.companyEmployeeId || "",
      companyWebsite: user.companyWebsite || "",
    });
  };

  useEffect(() => {
    if (!user) return;
    resetFormFromUser();
  }, [user]);

  useEffect(() => {
    async function loadEmployerStats() {
      if (user?.role !== "employer") return;
      try {
        const jobsRes = await api.get("/jobs/my-jobs");
        const jobs = jobsRes.data.jobs || [];
        const appResponses = await Promise.allSettled(
          jobs.map((job) => api.get(`/applications/job/${job._id}`))
        );
        const allApplications = appResponses.flatMap((result) =>
          result.status === "fulfilled" ? result.value.data.applications || [] : []
        );
        const resolved = allApplications.filter((app) => app.status !== "pending").length;
        const responseRate = allApplications.length
          ? Math.round((resolved / allApplications.length) * 100)
          : 0;
        setEmployerStats({
          activeJobs: jobs.length,
          applicants: allApplications.length,
          responseRate,
        });
      } catch {
        setEmployerStats({ activeJobs: 0, applicants: 0, responseRate: 0 });
      }
    }
    loadEmployerStats();
  }, [user?.role]);

  const employerProfileCompletion = useMemo(() => {
    const fields = [
      form.name,
      user?.email,
      form.contactNumber,
      form.companyName,
      form.employmentPosition,
      form.companyEmployeeId,
      form.companyWebsite,
      form.bio,
    ];
    return Math.round(
      (fields.filter((value) => Boolean(String(value || "").trim())).length / fields.length) * 100
    );
  }, [
    form.name,
    user?.email,
    form.contactNumber,
    form.companyName,
    form.employmentPosition,
    form.companyEmployeeId,
    form.companyWebsite,
    form.bio,
  ]);

  const seekerProfileCompletion = useMemo(() => {
    const fields = [
      form.name,
      user?.email,
      form.contactNumber,
      form.bio,
      form.location,
      form.educationLevel,
      form.university,
      form.graduationYear,
      form.skills,
      form.linkedinUrl,
      form.portfolioUrl,
    ];
    return Math.round(
      (fields.filter((value) => Boolean(String(value || "").trim())).length / fields.length) * 100
    );
  }, [
    form.name,
    user?.email,
    form.contactNumber,
    form.bio,
    form.location,
    form.educationLevel,
    form.university,
    form.graduationYear,
    form.skills,
    form.linkedinUrl,
    form.portfolioUrl,
  ]);

  const adminProfileCompletion = useMemo(() => {
    const fields = [form.name, user?.email, form.contactNumber, form.bio];
    return Math.round(
      (fields.filter((value) => Boolean(String(value || "").trim())).length / fields.length) * 100
    );
  }, [form.name, user?.email, form.contactNumber, form.bio]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        contactNumber: form.contactNumber,
        bio: form.bio,
        location: form.location,
        educationLevel: form.educationLevel,
        university: form.university,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        skills: form.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        linkedinUrl: form.linkedinUrl,
        portfolioUrl: form.portfolioUrl,
        companyName: form.companyName,
        employmentPosition: form.employmentPosition,
        companyEmployeeId: form.companyEmployeeId,
        companyWebsite: form.companyWebsite,
      };
      const { data } = await api.put("/users/profile", payload);
      setUser(data.user);
      setIsEditing(false);
      setIsError(false);
      setMessage("Profile updated successfully.");
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("profileImage", imageFile);
    try {
      const { data } = await api.post("/users/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data.user);
      setImageFile(null);
      setIsError(false);
      setMessage("Profile image uploaded.");
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setMessage("");
    resetFormFromUser();
  };

  if (user?.role === "employer") {
    return (
      <div className="employer-profile-shell">
        <section className="dash-panel employer-profile-hero">
          <div className="employer-profile-hero-top" />
          <div className="employer-profile-hero-body">
            <img
              className="avatar employer-profile-avatar"
              src={profileImageUrl}
              alt="profile"
              onError={(event) => {
                event.currentTarget.src = "https://via.placeholder.com/120";
              }}
            />
            <div>
              <div className="employer-profile-title-row">
                <h1 className="dash-title">{user?.name || "Employer"}</h1>
                <span className="schedule-shortlisted-pill">
                  {(user?.accountStatus || "pending").replace("_", " ")}
                </span>
              </div>
              <p className="dash-muted">{form.employmentPosition || "Employer"} • {form.companyName || "Company"}</p>
              <p className="dash-muted">{user?.email || "-"} {form.location ? `• ${form.location}` : ""}</p>
            </div>
            <div className="employer-profile-top-actions">
              {form.companyWebsite ? (
                <a className="btn secondary-btn small-btn" href={form.companyWebsite} target="_blank" rel="noreferrer">
                  Visit Website
                </a>
              ) : null}
              <label className="btn secondary-btn small-btn employer-profile-upload-btn">
                Select Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  hidden
                />
              </label>
              <button className="btn secondary-btn small-btn" type="button" onClick={handleImageUpload} disabled={!imageFile || uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </section>

        {message ? <p className={isError ? "error" : "dash-success"}>{message}</p> : null}

        <div className="employer-profile-grid">
          <section className="dash-panel employer-profile-main">
            <h2>Personnel Information</h2>
            <div className="dash-form-grid">
              <label>
                Full Name
                <input
                  value={form.name}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Contact Number
                <input
                  value={form.contactNumber}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                />
              </label>
              <label>
                Company Name
                <input
                  value={form.companyName}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </label>
              <label>
                Position
                <input
                  value={form.employmentPosition}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, employmentPosition: e.target.value })}
                />
              </label>
              <label>
                Employee ID
                <input
                  value={form.companyEmployeeId}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, companyEmployeeId: e.target.value })}
                />
              </label>
              <label>
                Company Website
                <input
                  value={form.companyWebsite}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                />
              </label>
            </div>

            <div className="dash-panel employer-profile-bio-panel">
              <div className="dash-panel-head">
                <h3>Company Bio</h3>
                <p className="dash-muted">
                  Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-"}
                </p>
              </div>
              <label className="post-job-field">
                About your company
                <textarea
                  rows={7}
                  value={form.bio}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </label>
            </div>

            <div className="employer-profile-actions-row">
              {!isEditing ? (
                <button className="btn" type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button className="btn secondary-btn" type="button" onClick={cancelEditing}>
                    Discard Changes
                  </button>
                  <button className="btn" type="button" onClick={handleUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Save Profile Settings"}
                  </button>
                </>
              )}
            </div>
          </section>

          <aside className="employer-profile-side">
            <section className="dash-panel employer-profile-side-card">
              <h3>Activity Overview</h3>
              <div className="employer-profile-metric-list">
                <div className="employer-profile-metric-item">
                  <p className="dash-muted">Active Jobs</p>
                  <p className="overview-side-value">{employerStats.activeJobs}</p>
                </div>
                <div className="employer-profile-metric-item">
                  <p className="dash-muted">Applicants</p>
                  <p className="overview-side-value">{employerStats.applicants}</p>
                </div>
                <div className="employer-profile-metric-item">
                  <p className="dash-muted">Response Rate</p>
                  <p className="overview-side-value">{employerStats.responseRate}%</p>
                </div>
              </div>
            </section>

            <section className="dash-panel employer-profile-side-card">
              <h3>Public Profile</h3>
              <p className="dash-muted">Your profile helps candidates trust your company and role listings.</p>
              <div className="employer-profile-side-row">
                <span>Profile completion</span>
                <span className="overview-side-value">{employerProfileCompletion}%</span>
              </div>
              <div className="employer-profile-side-row">
                <span>Visibility Status</span>
                <span className="app-status-chip">Visible</span>
              </div>
            </section>

            <section className="dash-panel employer-profile-side-card">
              <h3>Account Security</h3>
              <div className="employer-profile-side-row">
                <span>Change Password</span>
                <span className="dash-muted">Available</span>
              </div>
              <div className="employer-profile-side-row">
                <span>Two-factor Auth</span>
                <span className="dash-muted">Planned</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  if (user?.role === "job_seeker") {
    const educationLine = [form.educationLevel, form.university].filter((s) => String(s || "").trim()).join(" · ");
    const contactLine = [user?.email, form.location].filter((s) => String(s || "").trim()).join(" · ");

    return (
      <div className="employer-profile-shell settings-profile-shell--seeker">
        <section className="dash-panel employer-profile-hero settings-hero settings-hero--seeker">
          <div className="employer-profile-hero-top settings-hero-banner" />
          <div className="employer-profile-hero-body settings-hero-body">
            <div className="settings-hero-avatar-wrap">
              <img
                className="avatar employer-profile-avatar settings-hero-avatar"
                src={profileImageUrl}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = "https://via.placeholder.com/120";
                }}
              />
            </div>
            <div className="settings-hero-identity">
              <div className="employer-profile-title-row settings-hero-title-row">
                <h1 className="dash-title settings-hero-name">{user?.name || "Your name"}</h1>
                <span className="settings-role-pill">Job seeker</span>
              </div>
              <dl className="settings-hero-meta">
                <div>
                  <dt>Education</dt>
                  <dd>{educationLine || "Add in profile information below"}</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>{contactLine || "—"}</dd>
                </div>
              </dl>
            </div>
            <aside className="settings-hero-aside">
              {(form.portfolioUrl || form.linkedinUrl) && (
                <div className="settings-hero-links">
                  {form.portfolioUrl ? (
                    <a
                      className="btn secondary-btn small-btn settings-hero-link-btn"
                      href={form.portfolioUrl.startsWith("http") ? form.portfolioUrl : `https://${form.portfolioUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Portfolio
                    </a>
                  ) : null}
                  {form.linkedinUrl ? (
                    <a
                      className="btn secondary-btn small-btn settings-hero-link-btn"
                      href={form.linkedinUrl.startsWith("http") ? form.linkedinUrl : `https://${form.linkedinUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                </div>
              )}
              <div className="settings-photo-card">
                <p className="settings-photo-label">Profile photo</p>
                {imageFile ? <p className="settings-photo-filename">{imageFile.name}</p> : null}
                <div className="settings-photo-actions">
                  <label className="btn secondary-btn small-btn employer-profile-upload-btn settings-photo-choose">
                    Choose image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      hidden
                    />
                  </label>
                  <button
                    className="btn small-btn settings-photo-upload-btn"
                    type="button"
                    onClick={handleImageUpload}
                    disabled={!imageFile || uploading}
                  >
                    {uploading ? "Uploading…" : "Save photo"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {message ? <p className={isError ? "error" : "dash-success"}>{message}</p> : null}

        <div className="employer-profile-grid">
          <section className="dash-panel employer-profile-main">
            <h2>Profile information</h2>
            <p className="dash-muted">Choose Edit profile to change your details; your public page stays read-only.</p>
            <div className="dash-form-grid">
              <label>
                Full name
                <input
                  value={form.name}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Contact number
                <input
                  value={form.contactNumber}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                />
              </label>
              <label>
                Location
                <input
                  value={form.location}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </label>
              <label>
                Education level
                <input
                  value={form.educationLevel}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                />
              </label>
              <label>
                University / school
                <input
                  value={form.university}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                />
              </label>
              <label>
                Graduation year
                <input
                  value={form.graduationYear}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                />
              </label>
              <label className="span-2">
                Skills (comma-separated)
                <input
                  value={form.skills}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </label>
              <label>
                LinkedIn URL
                <input
                  value={form.linkedinUrl}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                />
              </label>
              <label>
                Portfolio URL
                <input
                  value={form.portfolioUrl}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                />
              </label>
            </div>

            <div className="dash-panel employer-profile-bio-panel">
              <div className="dash-panel-head">
                <h3>About you</h3>
                <p className="dash-muted">
                  Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-"}
                </p>
              </div>
              <label className="post-job-field">
                Summary (visible on your public profile)
                <textarea
                  rows={7}
                  value={form.bio}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </label>
            </div>

            <div className="employer-profile-actions-row">
              {!isEditing ? (
                <button className="btn" type="button" onClick={() => setIsEditing(true)}>
                  Edit profile
                </button>
              ) : (
                <>
                  <button className="btn secondary-btn" type="button" onClick={cancelEditing}>
                    Discard changes
                  </button>
                  <button className="btn" type="button" onClick={handleUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Save profile settings"}
                  </button>
                </>
              )}
            </div>
          </section>

          <aside className="employer-profile-side">
            <section className="dash-panel employer-profile-side-card">
              <h3>Profile strength</h3>
              <div className="employer-profile-metric-list">
                <div className="employer-profile-metric-item">
                  <p className="dash-muted">Completion</p>
                  <p className="overview-side-value">{seekerProfileCompletion}%</p>
                </div>
              </div>
            </section>

            <section className="dash-panel employer-profile-side-card">
              <h3>Public profile</h3>
              <p className="dash-muted">
                Employers see your public profile after you apply. It is read-only; edit everything here in Settings.
              </p>
              <div className="employer-profile-side-row">
                <span>Preview</span>
                <Link className="dash-link-inline" to="/dashboard/profile">
                  View public profile
                </Link>
              </div>
            </section>

            <section className="dash-panel employer-profile-side-card">
              <h3>Account security</h3>
              <div className="employer-profile-side-row">
                <span>Change password</span>
                <span className="dash-muted">Available</span>
              </div>
              <div className="employer-profile-side-row">
                <span>Two-factor auth</span>
                <span className="dash-muted">Planned</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  const rolePillLabel =
    user?.role === "admin"
      ? "Administrator"
      : (user?.role || "User")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="employer-profile-shell settings-profile-shell--admin">
      <section className="dash-panel employer-profile-hero settings-hero settings-hero--admin">
        <div className="employer-profile-hero-top settings-hero-banner" />
        <div className="employer-profile-hero-body settings-hero-body">
          <div className="settings-hero-avatar-wrap">
            <img
              className="avatar employer-profile-avatar settings-hero-avatar"
              src={profileImageUrl}
              alt=""
              onError={(event) => {
                event.currentTarget.src = "https://via.placeholder.com/120";
              }}
            />
          </div>
          <div className="settings-hero-identity">
            <div className="employer-profile-title-row settings-hero-title-row">
              <h1 className="dash-title settings-hero-name">{user?.name || "Your name"}</h1>
              <span className="settings-role-pill">{rolePillLabel}</span>
            </div>
            <dl className="settings-hero-meta">
              <div>
                <dt>Email</dt>
                <dd>{user?.email || "—"}</dd>
              </div>
              <div>
                <dt>Account</dt>
                <dd>CareerLink {user?.role === "admin" ? "platform admin" : "user"}</dd>
              </div>
            </dl>
          </div>
          <aside className="settings-hero-aside">
            <div className="settings-photo-card">
              <p className="settings-photo-label">Profile photo</p>
              {imageFile ? <p className="settings-photo-filename">{imageFile.name}</p> : null}
              <div className="settings-photo-actions">
                <label className="btn secondary-btn small-btn employer-profile-upload-btn settings-photo-choose">
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    hidden
                  />
                </label>
                <button
                  className="btn small-btn settings-photo-upload-btn"
                  type="button"
                  onClick={handleImageUpload}
                  disabled={!imageFile || uploading}
                >
                  {uploading ? "Uploading…" : "Save photo"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {message ? <p className={isError ? "error" : "dash-success"}>{message}</p> : null}

      <div className="employer-profile-grid">
        <section className="dash-panel employer-profile-main">
          <h2>Profile information</h2>
          <p className="dash-muted">Use Edit profile to change your details; fields stay locked until then.</p>
          <div className="dash-form-grid">
            <label>
              Full name
              <input
                value={form.name}
                disabled={!isEditing}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Contact number
              <input
                value={form.contactNumber}
                disabled={!isEditing}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              />
            </label>
          </div>

          <div className="dash-panel employer-profile-bio-panel">
            <div className="dash-panel-head">
              <h3>Bio</h3>
              <p className="dash-muted">
                Last updated: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "-"}
              </p>
            </div>
            <label className="post-job-field">
              Short summary
              <textarea
                rows={7}
                value={form.bio}
                disabled={!isEditing}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </label>
          </div>

          <div className="employer-profile-actions-row">
            {!isEditing ? (
              <button className="btn" type="button" onClick={() => setIsEditing(true)}>
                Edit profile
              </button>
            ) : (
              <>
                <button className="btn secondary-btn" type="button" onClick={cancelEditing}>
                  Discard changes
                </button>
                <button className="btn" type="button" onClick={handleUpdate} disabled={saving}>
                  {saving ? "Saving..." : "Save profile settings"}
                </button>
              </>
            )}
          </div>
        </section>

        <aside className="employer-profile-side">
          <section className="dash-panel employer-profile-side-card">
            <h3>Profile strength</h3>
            <div className="employer-profile-metric-list">
              <div className="employer-profile-metric-item">
                <p className="dash-muted">Completion</p>
                <p className="overview-side-value">{adminProfileCompletion}%</p>
              </div>
            </div>
          </section>

          {user?.role === "admin" ? (
            <section className="dash-panel employer-profile-side-card">
              <h3>Admin tools</h3>
              <p className="dash-muted">Quick links to moderation and reporting.</p>
              <div className="employer-profile-side-row">
                <span>Analytics</span>
                <Link className="dash-link-inline" to="/dashboard/analytics-notifications">
                  Open
                </Link>
              </div>
              <div className="employer-profile-side-row">
                <span>Approvals</span>
                <Link className="dash-link-inline" to="/dashboard/approvals">
                  Open
                </Link>
              </div>
            </section>
          ) : null}

          <section className="dash-panel employer-profile-side-card">
            <h3>Public profile</h3>
            <p className="dash-muted">Preview how your profile card appears elsewhere in the app.</p>
            <div className="employer-profile-side-row">
              <span>Preview</span>
              <Link className="dash-link-inline" to="/dashboard/profile">
                View public profile
              </Link>
            </div>
          </section>

          <section className="dash-panel employer-profile-side-card">
            <h3>Account security</h3>
            <div className="employer-profile-side-row">
              <span>Change password</span>
              <span className="dash-muted">Available</span>
            </div>
            <div className="employer-profile-side-row">
              <span>Two-factor auth</span>
              <span className="dash-muted">Planned</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

