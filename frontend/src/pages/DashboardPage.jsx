import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, setUser } = useAuth();
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
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
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
    if (user) {
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
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
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
      setMessage("Profile updated.");
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
    <div className="container">
      <h1>Professional Dashboard</h1>
      <div className="profile-header card">
        <img
          className="avatar"
          src={profileImageUrl}
          alt="profile"
          onError={(event) => {
            event.currentTarget.src = "https://via.placeholder.com/120";
          }}
        />
        <div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <p>
            <strong>Role:</strong> {user?.role}
          </p>
          {user?.role === "employer" && (
            <p>
              <strong>Approval:</strong> {user?.accountStatus}
              {user?.approvalReason ? ` (${user.approvalReason})` : ""}
            </p>
          )}
        </div>
      </div>
      <div className="row">
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        <button className="btn" type="button" onClick={handleImageUpload}>
          Upload Profile Picture
        </button>
      </div>
      <form onSubmit={handleUpdate} className="form">
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Contact number"
          value={form.contactNumber}
          onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
        />
        <textarea
          placeholder="Professional summary"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
        />
        {user?.role === "job_seeker" && (
          <>
            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <input
              placeholder="Education level"
              value={form.educationLevel}
              onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
            />
            <input
              placeholder="University / Institute"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
            />
            <input
              type="number"
              placeholder="Graduation year"
              value={form.graduationYear}
              onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
            />
            <input
              placeholder="Skills (comma separated)"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <input
              placeholder="LinkedIn URL"
              value={form.linkedinUrl}
              onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
            />
            <input
              placeholder="Portfolio URL"
              value={form.portfolioUrl}
              onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
            />
          </>
        )}
        {user?.role === "employer" && (
          <>
            <input
              placeholder="Company name"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <input
              placeholder="Employment position"
              value={form.employmentPosition}
              onChange={(e) => setForm({ ...form, employmentPosition: e.target.value })}
            />
            <input
              placeholder="Company employee ID"
              value={form.companyEmployeeId}
              onChange={(e) => setForm({ ...form, companyEmployeeId: e.target.value })}
            />
            <input
              placeholder="Company website"
              value={form.companyWebsite}
              onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
            />
          </>
        )}
        {user?.role === "admin" && (
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        )}
        <button className="btn">Update Profile</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
