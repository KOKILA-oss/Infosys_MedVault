import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterAdminLogin.css';

const MASTER_CREDENTIALS = [
  { email: 'master@medvault.com', password: 'Master@123' },
  { email: 'root@medvault.com', password: 'Root@123' }
];

const MasterAdminLogin = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

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

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');

    const isValidMaster = MASTER_CREDENTIALS.some(
      (item) =>
        item.email.toLowerCase() === formData.email.toLowerCase().trim() &&
        item.password === formData.password
    );

    if (!isValidMaster) {
      setErrorMessage('Invalid master admin email or password.');
      return;
    }

    localStorage.setItem('role', 'master_admin');
    localStorage.setItem('master_admin_email', formData.email.toLowerCase().trim());
    localStorage.setItem('token', 'master-admin-session');
    navigate('/master-admin-dashboard');
  };

  return (
    <div className="master-login-container">
      <div className="master-login-card">
        <button onClick={toggleTheme} className="auth-theme-toggle" aria-label="Toggle theme">
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

        <div className="master-login-header">
          <h1>Master Admin Login</h1>
          <p>Restricted access for global administration</p>
        </div>

        <form onSubmit={handleSubmit} className="master-login-form">
          <div className="form-group">
            <label htmlFor="email">Master Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="master@medvault.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          {errorMessage ? <p className="master-error">{errorMessage}</p> : null}

          <button type="submit" className="master-login-btn">Login as Master Admin</button>
        </form>

        <button type="button" className="back-home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default MasterAdminLogin;
