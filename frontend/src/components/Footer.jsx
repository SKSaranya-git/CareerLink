export default function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>CareerLink</h3>
          <p>
            CareerLink connects talented students and professionals with trusted employers through
            a modern hiring platform.
          </p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <p>Home</p>
          <p>About</p>
          <p>Jobs</p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>support@careerlink.com</p>
          <p>+94 77 123 4567</p>
          <p>Colombo, Sri Lanka</p>
        </div>
      </div>
      <p className="footer-copy">Copyright {new Date().getFullYear()} CareerLink. All rights reserved.</p>
    </footer>
  );
}
