import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/careerlink-logo.svg";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="brand">
        <Link to="/" className="brand-link">
          <img src={logo} alt="CareerLink logo" className="brand-logo" />
          <span>CareerLink</span>
        </Link>
      </div>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <a href="/#about">About</a>
        <a href="/#contact">Contact</a>
        <Link to="/jobs">Jobs</Link>
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user?.role === "employer" && <Link to="/post-job">Post Job</Link>}
        {user?.role === "admin" && <Link to="/dashboard/approvals">Approvals</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && (
          <Link to="/register" className="btn small-btn">
            Register
          </Link>
        )}
        {user && (
          <button className="btn danger small-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
