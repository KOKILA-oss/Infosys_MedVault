import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">MV</span>
            <div className="brand-text">
              <span className="brand-name">MedVault</span>
              <span className="brand-tagline">Secure Care. Smarter Flow.</span>
            </div>
          </div>

          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#security">Security</a>
            <a href="#footer">Contact</a>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="landing-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <Link className="btn ghost" to="/login">Login</Link>
            <Link className="btn primary" to="/signup">Sign Up</Link>
          </div>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">Unified healthcare operations</p>
            <h1>One platform for patients, doctors, and administrators.</h1>
            <p className="hero-copy">
              MedVault streamlines appointments, records, and care coordination
              with role-based dashboards, smart scheduling, and secure access.
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/signup">Get Started</Link>
              <a className="btn outline" href="#features">Explore Features</a>
            </div>
            <div className="hero-badges">
              <span>Role-aware dashboards</span>
              <span>OTP-secured access</span>
              <span>Fast booking flow</span>
              <span>Clinic-ready analytics</span>
            </div>
          </div>
          <div className="hero-panel" aria-hidden="true">
            <div className="panel-card">
              <h3>Today in MedVault</h3>
              <p>32 patient check-ins</p>
              <p>14 upcoming consultations</p>
              <p>98% profile completion</p>
            </div>
            <div className="panel-card accent">
              <h4>Smart reminders</h4>
              <p>Automated notifications reduce missed visits.</p>
            </div>
            <div className="panel-card">
              <h4>Live task queue</h4>
              <p>Track waiting rooms, triage, and follow-ups.</p>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <h3>35%</h3>
            <p>faster check-in flow</p>
          </div>
          <div className="stat-card">
            <h3>24/7</h3>
            <p>secure access to profiles</p>
          </div>
          <div className="stat-card">
            <h3>3 roles</h3>
            <p>patients, doctors, admins</p>
          </div>
          <div className="stat-card">
            <h3>100%</h3>
            <p>paperless appointment tracking</p>
          </div>
        </section>

        <section id="about" className="section about">
          <div className="section-title">
            <h2>About MedVault</h2>
            <p>
              Built for modern healthcare teams, MedVault keeps patient journeys
              visible, coordinated, and secure. From registration to follow-up,
              every interaction is tracked with clarity.
            </p>
          </div>
          <div className="about-grid">
            <div>
              <h3>Patients</h3>
              <p>Book visits, manage profiles, and review appointments in seconds.</p>
            </div>
            <div>
              <h3>Doctors</h3>
              <p>Stay on top of schedules, bookings, and patient context.</p>
            </div>
            <div>
              <h3>Admins</h3>
              <p>Oversee operations, manage staff, and keep care running smoothly.</p>
            </div>
          </div>
        </section>

        <section id="features" className="section features">
          <div className="section-title">
            <h2>Core functionality</h2>
            <p>Everything your clinic needs to deliver responsive care.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Secure onboarding</h3>
              <p>OTP-based verification and guided setup for every user role.</p>
            </article>
            <article className="feature-card">
              <h3>Appointment intelligence</h3>
              <p>Streamlined booking, reminders, and live status updates.</p>
            </article>
            <article className="feature-card">
              <h3>Unified profiles</h3>
              <p>Centralized patient and doctor profiles with quick access.</p>
            </article>
            <article className="feature-card">
              <h3>Team coordination</h3>
              <p>Shared notes, handoffs, and visit readiness at a glance.</p>
            </article>
            <article className="feature-card">
              <h3>Admin controls</h3>
              <p>Assign roles, manage rosters, and track clinic performance.</p>
            </article>
            <article className="feature-card">
              <h3>Patient engagement</h3>
              <p>Notifications, confirmations, and follow-up reminders.</p>
            </article>
          </div>
        </section>

        <section id="modules" className="section modules">
          <div className="section-title">
            <h2>Modules that work together</h2>
            <p>Each module supports a role while sharing the same data layer.</p>
          </div>
          <div className="module-grid">
            <div className="module-card">
              <h3>Patient Hub</h3>
              <p>Profile updates, appointment history, and upcoming bookings.</p>
            </div>
            <div className="module-card">
              <h3>Doctor Workspace</h3>
              <p>Daily queues, patient detail views, and visit preparation.</p>
            </div>
            <div className="module-card">
              <h3>Admin Control Center</h3>
              <p>Doctor and patient management with operational insights.</p>
            </div>
            <div className="module-card">
              <h3>Scheduling Engine</h3>
              <p>Slot availability, booking approvals, and rescheduling.</p>
            </div>
          </div>
        </section>

        <section id="security" className="section security">
          <div className="section-title">
            <h2>Security you can trust</h2>
            <p>Designed with healthcare-grade privacy and accountability.</p>
          </div>
          <div className="security-grid">
            <div className="security-card">
              <h3>Role-based access</h3>
              <p>Each user only sees what they need to deliver care.</p>
            </div>
            <div className="security-card">
              <h3>OTP verification</h3>
              <p>Two-step entry keeps patient data protected.</p>
            </div>
            <div className="security-card">
              <h3>Audit-ready</h3>
              <p>Activity tracking supports accountability across teams.</p>
            </div>
          </div>
        </section>

        <section id="workflow" className="section workflow">
          <div className="section-title">
            <h2>How it works</h2>
            <p>From login to care delivery in three clean steps.</p>
          </div>
          <div className="workflow-steps">
            <div className="step">
              <span>01</span>
              <h3>Authenticate</h3>
              <p>Sign in with secure OTP to reach the right dashboard.</p>
            </div>
            <div className="step">
              <span>02</span>
              <h3>Coordinate</h3>
              <p>Manage bookings, profiles, and status updates in one place.</p>
            </div>
            <div className="step">
              <span>03</span>
              <h3>Deliver care</h3>
              <p>Track visits and outcomes while keeping patients informed.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <div>
            <h2>Ready to modernize your clinic?</h2>
            <p>Launch MedVault today and bring every role into one smart workflow.</p>
          </div>
          <div className="cta-actions">
            <Link className="btn primary" to="/signup">Start Free</Link>
            <Link className="btn ghost" to="/login">Login</Link>
          </div>
        </section>
      </main>

      <footer id="footer" className="landing-footer">
        <div>
          <h3>MedVault</h3>
          <p>Smart healthcare management for connected teams.</p>
        </div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#modules">Modules</a>
          <a href="#security">Security</a>
          <a href="mailto:medvault@support.com">medvault@support.com</a>
        </div>
        <div className="footer-cta">
          <p>Need a walkthrough? Reach out to our onboarding team.</p>
          <Link className="btn primary" to="/signup">Create account</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
