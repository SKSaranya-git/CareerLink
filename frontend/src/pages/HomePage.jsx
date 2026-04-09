import { Link } from "react-router-dom";
import teamImage from "../assets/home/team-collaboration.png";
import jobSearchImage from "../assets/home/job-search-screen.png";

export default function HomePage() {
  return (
    <div className="home-page home-page--pro">
      <section className="hero-section hero-section--pro">
        <div className="hero-content hero-content--pro">
          <p className="eyebrow">CareerLink Platform</p>
          <h1>Build your career with trusted opportunities and professional visibility.</h1>
          <p>
            CareerLink connects motivated candidates and verified employers through a transparent,
            role-based hiring experience built for real outcomes.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn">
              Get Started

            </Link>
            <Link to="/jobs" className="btn secondary-btn">
              Browse Jobs
            </Link>
          </div>
          <div className="hero-proof-grid">
            <div className="hero-proof-item">
              <strong>6,000+</strong>
              <span>Registered users</span>
            </div>
            <div className="hero-proof-item">
              <strong>4,200+</strong>
              <span>Applications submitted</span>
            </div>
            <div className="hero-proof-item">
              <strong>500+</strong>
              <span>Verified employers</span>
            </div>
          </div>
        </div>

        <div className="hero-visual hero-visual--pro">
          <img src={teamImage} alt="Career professionals collaborating" className="hero-main-image" />
          <div className="hero-card hero-card--pro">
            <h3>Professional hiring, simplified</h3>
            <p>
              Secure profiles, quality employer vetting, and a structured process from application
              to interview.
            </p>
          </div>
        </div>
      </section>

      <section id="about" className="section-block section-block--pro">
        <div className="section-head">
          <p className="eyebrow dark">Why CareerLink</p>
          <h2>Everything needed for credible, efficient recruitment</h2>
        </div>
        <div className="pro-feature-grid">
          <article className="pro-feature-card">
            <h3>Career-Ready Profiles</h3>
            <p>
              Present education, skills, and experience in a consistent format recruiters can review
              quickly.
            </p>
          </article>
          <article className="pro-feature-card">
            <h3>Verified Employer Access</h3>
            <p>
              Admin-reviewed employer onboarding helps maintain platform quality and candidate trust.
            </p>
          </article>
          <article className="pro-feature-card">
            <h3>Role-Based Dashboards</h3>
            <p>
              Dedicated experiences for job seekers, employers, and administrators keep workflows
              focused and efficient.
            </p>
          </article>
        </div>
      </section>

      <section className="section-block hiring-flow">
        <div className="section-head section-head--left">
          <p className="eyebrow dark">How it works</p>
          <h2>A clear process from discovery to decision</h2>
        </div>
        <div className="hiring-flow-grid">
          <div className="flow-card">
            <span className="flow-number">01</span>
            <h3>Create your profile</h3>
            <p>Job seekers build a strong profile while employers complete verification.</p>
          </div>
          <div className="flow-card">
            <span className="flow-number">02</span>
            <h3>Find the right match</h3>
            <p>Search and filter opportunities, then apply with complete, recruiter-friendly data.</p>
          </div>
          <div className="flow-card">
            <span className="flow-number">03</span>
            <h3>Track and respond</h3>
            <p>Monitor applications, schedule interviews, and manage outcomes with clarity.</p>
          </div>
        </div>
      </section>

      <section className="section-block split-feature split-feature--pro">
        <div className="feature-image-wrap feature-image-wrap--pro">
          <img src={jobSearchImage} alt="Job search on laptop" className="feature-image" />
        </div>
        <div className="feature-copy feature-copy--pro">
          <h2>Designed for measurable hiring outcomes</h2>
          <p>
            CareerLink supports fair hiring and economic growth by making opportunities visible,
            applications structured, and employer workflows accountable.
          </p>
          <p>
            With transparent processes and role-specific tools, teams can hire confidently while
            candidates stay informed at every step.
          </p>
          <Link to="/jobs" className="btn">
            View Opportunities
          </Link>
        </div>
      </section>

      <section className="section-block testimonial-section testimonial-section--pro">
        <div className="section-head">
          <p className="eyebrow dark">Community trust</p>
          <h2>Used by students, employers, and career advisors</h2>
        </div>
        <div className="pro-feature-grid testimonials-grid">
          <div className="pro-feature-card quote-card">
            <p>
              "CareerLink helped me convert my profile into interviews within two weeks. The process
              felt organized and transparent."
            </p>
            <strong>Nethmi, Job Seeker</strong>
          </div>
          <div className="pro-feature-card quote-card">
            <p>
              "The verification workflow improves trust. We can post confidently and evaluate
              applicants faster with complete profiles."
            </p>
            <strong>Arjun, Hiring Manager</strong>
          </div>
          <div className="pro-feature-card quote-card">
            <p>
              "A professional platform for both employers and students. Reporting and workflow
              visibility make advising easier."
            </p>
            <strong>Malithi, Career Advisor</strong>
          </div>
        </div>
      </section>

      <section className="section-block final-cta">
        <div>
          <p className="eyebrow">Start with confidence</p>
          <h2>Join CareerLink and move from searching to progressing.</h2>
        </div>
        <div className="hero-actions">
          <Link to="/register" className="btn">
            Register Now
          </Link>
          <Link to="/jobs" className="btn secondary-btn">
            Explore Open Roles
          </Link>
        </div>
      </section>
    </div>
  );
}