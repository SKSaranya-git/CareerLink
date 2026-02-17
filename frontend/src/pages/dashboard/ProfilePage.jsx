import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
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

  useEffect(() => {
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
  }, [user]);

  const handleUpdate = async () => {
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
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Update failed.");
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    const formData = new FormData();
    formData.append("profileImage", imageFile);
    try {
      const { data } = await api.post("/users/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data.user);
      setImageFile(null);
      setMessage("Profile image uploaded.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Image upload failed.");
    }
  };

  return (
    <div>
      <div className="dash-profile-head">
        <div className="dash-profile-card">
          <img
            className="avatar"
            src={profileImageUrl}
            alt="profile"
            onError={(event) => {
              event.currentTarget.src = "https://via.placeholder.com/120";
            }}
          />
          <div>
            <h1 className="dash-title">{user?.name}</h1>
            <p className="dash-muted">{user?.email}</p>
            <p className="dash-muted">Role: {user?.role?.replace("_", " ")}</p>
            {user?.role === "employer" && (
              <p className="dash-muted">
                Status: {user?.accountStatus}
                {user?.approvalReason ? ` (${user.approvalReason})` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="dash-profile-actions">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <button className="btn secondary-btn" type="button" onClick={handleImageUpload}>
            Upload Photo
          </button>
          {!isEditing ? (
            <button className="btn" type="button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          ) : (
            <button className="btn" type="button" onClick={handleUpdate}>
              Update
            </button>
          )}
        </div>
      </div>

      {message && <p>{message}</p>}

      <div className="dash-panel">
        <h2>Profile Details</h2>
        <div className="dash-form-grid">
          <label>
            Name
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
          <label className="span-2">
            Bio
            <textarea
              rows={4}
              value={form.bio}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>

          {user?.role === "job_seeker" && (
            <>
              <label>
                Location
                <input
                  value={form.location}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </label>
              <label>
                Education Level
                <input
                  value={form.educationLevel}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
                />
              </label>
              <label>
                University
                <input
                  value={form.university}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                />
              </label>
              <label>
                Graduation Year
                <input
                  value={form.graduationYear}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                />
              </label>
              <label className="span-2">
                Skills
                <input
                  value={form.skills}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </label>
              <label>
                LinkedIn
                <input
                  value={form.linkedinUrl}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                />
              </label>
              <label>
                Portfolio
                <input
                  value={form.portfolioUrl}
                  disabled={!isEditing}
                  onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                />
              </label>
            </>
          )}

          {user?.role === "employer" && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

