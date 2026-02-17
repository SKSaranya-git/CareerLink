import { Link } from "react-router-dom";
import teamImage from "../assets/home/team-collaboration.png";
import jobSearchImage from "../assets/home/job-search-screen.png";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">CareerLink Platform</p>
          <h1>Find meaningful work and build your future with confidence.</h1>
          <p>
            CareerLink helps job seekers discover verified opportunities while enabling employers to
            recruit qualified talent in a transparent, professional environment.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn">
              Get Started
            </Link>
            <Link to="/jobs" className="btn secondary-btn">
              Explore Jobs
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <img src={teamImage} alt="Career professionals collaborating" className="hero-main-image" />
          <div className="hero-card">
            <h3>Trusted by students and employers</h3>
            <p>Secure profiles, role-based dashboards, and streamlined applications.</p>
          </div>
        </div>
      </section>

      <section id="about" className="section-block">
        <h2>What CareerLink offers</h2>
        <div className="grid">
          <div className="card">
            <h3>Professional Profiles</h3>
            <p>Showcase your education, skills, and achievements in a recruiter-friendly format.</p>
          </div>
          <div className="card">
            <h3>Role-Based Workflows</h3>
            <p>Structured experiences for job seekers, employers, and administrators.</p>
          </div>
          <div className="card">
            <h3>Verified Employer Access</h3>
            <p>Employer registrations are reviewed by admins for platform trust and quality.</p>
          </div>
        </div>
      </section>

      <section className="stats-banner">
        <div>
          <h3>6,000+</h3>
          <p>Career-focused users</p>
        </div>
        <div>
          <h3>4,200+</h3>
          <p>Successful applications</p>
        </div>
        <div>
          <h3>500+</h3>
          <p>Active employers</p>
        </div>
      </section>

      <section className="section-block split-feature">
        <div className="feature-image-wrap">
          <img src={jobSearchImage} alt="Job search on laptop" className="feature-image" />
        </div>
        <div className="feature-copy">
          <h2>Purpose-driven hiring with measurable impact</h2>
          <p>
            We align with the "Decent Work and Economic Growth" mission by connecting capable
            candidates with fair opportunities and helping employers hire responsibly.
          </p>
          <p>
            CareerLink gives recruiters structured profiles, verified employer onboarding, and a
            transparent decision workflow.
          </p>
        </div>
      </section>

      <section className="section-block testimonial-section">
        <h2>Community feedback</h2>
        <div className="grid">
          <div className="card">
            <p>
              "CareerLink helped me turn my university profile into real interviews in just two
              weeks."
            </p>
            <strong>- Nethmi, Job Seeker</strong>
          </div>
          <div className="card">
            <p>
              "The employer approval process gives us confidence that we are hiring on a reliable
              platform."
            </p>
            <strong>- Arjun, Hiring Manager</strong>
          </div>
          <div className="card">
            <p>
              "The platform design is professional and easy to use. I can track employer reviews,
              applications, and profile updates with clarity."
            </p>
            <strong>- Malithi, University Career Advisor</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
