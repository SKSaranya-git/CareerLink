import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Dialog from "../components/Dialog";

const allowedRoles = ["job_seeker", "employer", "admin"];

export default function RegisterPage() {
  const { role } = useParams();
  const selectedRole = allowedRoles.includes(role) ? role : "";
  const [employerProof, setEmployerProof] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    password: "",
    role: "",
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
    adminInviteCode: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dialog, setDialog] = useState({ open: false, title: "", message: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setForm((prev) => ({ ...prev, role }));
    setEmployerProof(null);
    setError("");
    setMessage("");
    navigate(`/register/${role}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
        skills: form.skills
          ? form.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      };

      let data;
      if (selectedRole === "employer") {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value)) {
            value.forEach((v) => formData.append(key, String(v)));
          } else {
            formData.append(key, String(value));
          }
        });
        if (employerProof) {
          formData.append("employerProof", employerProof);
        }
        const res = await api.post("/auth/register", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        data = res.data;
      } else {
        const res = await api.post("/auth/register", payload);
        data = res.data;
      }

      if (data.pendingApproval) {
        setDialog({
          open: true,
          title: "Employer Registration Submitted",
          message:
            "Employer registration submitted. Wait for admin approval. You will receive an email decision.",
        });
        return;
      }
      login({ token: data.token, user: data.user });
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      setError(msg);
      setDialog({ open: true, title: "Registration Failed", message: msg });
    }
  };

  const renderRoleSpecificFields = () => {
    if (selectedRole === "job_seeker") {
      return (
        <>
          <textarea
            placeholder="Professional summary"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
          <input
            placeholder="Education level (e.g., Undergraduate)"
            value={form.educationLevel}
            onChange={(e) => setForm({ ...form, educationLevel: e.target.value })}
            required
          />
          <input
            placeholder="University / Institute"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            required
          />
          <input
            placeholder="Graduation year"
            type="number"
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
      );
    }

    if (selectedRole === "employer") {
      return (
        <>
          <input
            placeholder="Company name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
          />
          <input
            placeholder="Your position in company"
            value={form.employmentPosition}
            onChange={(e) => setForm({ ...form, employmentPosition: e.target.value })}
            required
          />
          <input
            placeholder="Company employee ID"
            value={form.companyEmployeeId}
            onChange={(e) => setForm({ ...form, companyEmployeeId: e.target.value })}
            required
          />
          <input
            placeholder="Company website"
            value={form.companyWebsite}
            onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
          />
          <textarea
            placeholder="Brief company or hiring description"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <div className="file-field">
            <label className="file-label">
              Company Proof (PDF/PNG)
              <input
                type="file"
                accept=".pdf,.png,application/pdf,image/png"
                onChange={(e) => setEmployerProof(e.target.files?.[0] || null)}
              />
            </label>
            <p className="muted">
              Upload a registration proof (business registration / company ID). This helps admin verify your company.
            </p>
          </div>
        </>
      );
    }

    if (selectedRole === "admin") {
      return (
        <>
          <input
            placeholder="Admin invite code"
            value={form.adminInviteCode}
            onChange={(e) => setForm({ ...form, adminInviteCode: e.target.value })}
            required
          />
          <textarea
            placeholder="Short admin profile summary"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </>
      );
    }

    return null;
  };

  if (!selectedRole) {
    return (
      <div className="auth-layout">
        <div className="register-role-wrap">
          <p className="eyebrow dark center">Get Started</p>
          <h1 className="center">Create your account</h1>
          <p className="auth-subtitle center">
            Select the role that describes you best. Your registration form adapts to your choice.
          </p>

          <div className="grid role-grid">
            <button className="card role-btn" onClick={() => handleRoleSelect("job_seeker")} type="button">
              <span className="role-pill">Candidate</span>
              <h3>Job Seeker</h3>
              <p>Build a professional profile and apply for opportunities that match your skills.</p>
            </button>
            <button className="card role-btn" onClick={() => handleRoleSelect("employer")} type="button">
              <span className="role-pill">Company</span>
              <h3>Employer</h3>
              <p>Post vacancies, manage applications, and discover top talent for your organization.</p>
            </button>
            <button className="card role-btn" onClick={() => handleRoleSelect("admin")} type="button">
              <span className="role-pill">Administrator</span>
              <h3>Admin</h3>
              <p>Access the platform dashboard with moderation and management controls.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
      <Dialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onClose={() => setDialog({ open: false, title: "", message: "" })}
      />
      <div className="auth-card register-card">
        <p className="eyebrow dark">CareerLink Registration</p>
        <h1>Create {selectedRole.replace("_", " ")} account</h1>
        <p className="auth-subtitle">
          Enter your professional details. You can update your profile any time after registration.
        </p>
        <button className="auth-link-btn" type="button" onClick={() => navigate("/register")}>
          Choose another role
        </button>
        {error && <p className="error">{error}</p>}
        {message && <p>{message}</p>}
        <form onSubmit={handleSubmit} className="form">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            placeholder="Contact number"
            value={form.contactNumber}
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
            required
          />
          {renderRoleSpecificFields()}
          <button className="btn" type="submit">
            Register
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
