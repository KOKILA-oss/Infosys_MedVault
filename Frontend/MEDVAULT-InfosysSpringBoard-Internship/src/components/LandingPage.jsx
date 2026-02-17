import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
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
      <nav className="landing-navbar">
        <div className="landing-brand">
          <div className="landing-brand-icon">⚕</div>
          <span className="landing-brand-text">MedVault</span>
        </div>

        <ul className="landing-nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#features">Functionality</a></li>
        </ul>

        <div className="landing-auth-actions">
          <button onClick={toggleTheme} className="landing-theme-toggle" aria-label="Toggle theme">
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
          <button type="button" className="landing-master-btn" onClick={() => navigate('/master-login')}>
            Master Login
          </button>
          <button type="button" className="landing-login-btn" onClick={() => navigate('/login')}>
            Login
          </button>
          <button type="button" className="landing-signup-btn" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </nav>

      <main className="landing-main" id="home">
        <section className="landing-hero">
          <span className="landing-tag">Modern Healthcare Platform</span>
          <h1>Secure Digital Healthcare, All in One Place</h1>
          <p>
            MedVault helps patients, doctors, and administrators collaborate through a secure,
            role-based platform for appointments, profiles, and medical record workflows.
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="landing-cta" onClick={() => navigate('/signup')}>
              Get Started
            </button>
            <button type="button" className="landing-cta-secondary" onClick={() => navigate('/login')}>
              Already have an account?
            </button>
          </div>

          <div className="landing-stats-grid">
            <article className="landing-stat-card">
              <h3>3 User Roles</h3>
              <p>Patient, Doctor, and Admin dashboards with dedicated actions.</p>
            </article>
            <article className="landing-stat-card">
              <h3>OTP Verification</h3>
              <p>Secure login and recovery flows with verification checkpoints.</p>
            </article>
            <article className="landing-stat-card">
              <h3>Unified Workflows</h3>
              <p>Bookings, profiles, and account management in one portal.</p>
            </article>
          </div>
        </section>

        <section className="landing-about" id="about">
          <h2>About Us</h2>
          <p>
            MedVault is built to modernize healthcare interactions with a privacy-focused,
            easy-to-use web application. Our goal is to reduce communication gaps between
            patients and care providers while keeping sensitive health data secure and accessible
            to authorized users only.
          </p>
        </section>

        <section className="landing-features" id="features">
          <h2>What MedVault Enables</h2>
          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <h3>Authentication & Security</h3>
              <p>
                OTP-based login flows, protected sessions, and role-aware access for patients,
                doctors, and admins.
              </p>
            </article>

            <article className="landing-feature-card">
              <h3>Role-Based Dashboards</h3>
              <p>
                Dedicated dashboards streamline actions for each user type, improving workflow
                clarity and productivity.
              </p>
            </article>

            <article className="landing-feature-card">
              <h3>Appointments & Profiles</h3>
              <p>
                Manage bookings, view and update profiles, and maintain consistent healthcare
                coordination in one platform.
              </p>
            </article>

            <article className="landing-feature-card">
              <h3>Password Recovery Flow</h3>
              <p>
                User-friendly forgot-password and reset journeys that keep access secure and
                reliable.
              </p>
            </article>

            <article className="landing-feature-card">
              <h3>Doctor-Patient Connectivity</h3>
              <p>
                Patients can book appointments efficiently while doctors monitor and manage their
                schedule.
              </p>
            </article>

            <article className="landing-feature-card">
              <h3>Admin Oversight</h3>
              <p>
                Administrative panels support doctor and patient management for smooth platform
                governance.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-workflow">
          <h2>How It Works</h2>
          <div className="landing-workflow-grid">
            <article className="landing-workflow-step">
              <span>01</span>
              <h3>Create Account</h3>
              <p>Sign up as a user and complete your profile details securely.</p>
            </article>
            <article className="landing-workflow-step">
              <span>02</span>
              <h3>Verify & Login</h3>
              <p>Use OTP verification for protected and trusted authentication.</p>
            </article>
            <article className="landing-workflow-step">
              <span>03</span>
              <h3>Manage Care Journey</h3>
              <p>Access bookings, profiles, and role-specific dashboard tools instantly.</p>
            </article>
          </div>
        </section>

        <section className="landing-roles">
          <h2>Built for Every Stakeholder</h2>
          <div className="landing-roles-grid">
            <article className="landing-role-card">
              <h3>For Patients</h3>
              <p>Book consultations, update profile data, and track interactions with doctors.</p>
            </article>
            <article className="landing-role-card">
              <h3>For Doctors</h3>
              <p>Review appointments, manage practice workflow, and maintain service quality.</p>
            </article>
            <article className="landing-role-card">
              <h3>For Admins</h3>
              <p>Control system operations, user records, and platform-level oversight.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} MedVault. Smart, secure, and patient-centered healthcare management.</p>
      </footer>
    </div>
  );
};

export default LandingPage;