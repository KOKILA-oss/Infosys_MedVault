import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [errorMessage, setErrorMessage] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpStatusMessage, setOtpStatusMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage("");   // clear old error
  setOtpStatusMessage('OTP sending...');
  setIsSendingOtp(true);

  try {
     await axios.post("/api/auth/login/request-otp", {
      email: formData.username,
      password: formData.password
    });

    setOtpStatusMessage('OTP sent. Redirecting to verification...');

    navigate('/otp-verify', {
      state: {
        type: "login",
        userData: {
          email: formData.username
        }
      }
    });

  } catch (error) {
    setOtpStatusMessage('');
    if (error.response) {
      setErrorMessage(error.response.data);
    } else {
      setErrorMessage("Something went wrong.");
    }
  } finally {
    setIsSendingOtp(false);
  }
};


  return (
    <div className="login-container">
      {/* Medical Background Pattern */}
      <div className="medical-bg">
        <div className="pulse-circle"></div>
        <div className="pulse-circle"></div>
        <div className="pulse-circle"></div>
      </div>

      <div className="login-card">
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
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="logo-text">MedVault</h1>
          </div>
          <p className="login-subtitle">Secure Health Records Management</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isSendingOtp}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isSendingOtp}
                required
              />

            </div>
          </div>

          {otpStatusMessage && <p className="otp-status">{otpStatusMessage}</p>}
          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="link-btn"
              disabled={isSendingOtp}
            >
              Forgot Password?
            </button>
          </div>

        <button type="submit" className="login-btn">
            <span>{isSendingOtp ? 'OTP sending...' : 'Sign In'}</span>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} className="link-btn">
              Create Account
            </button>
          </p>
          <p>
            Master Admin?{' '}
            <button onClick={() => navigate('/master-login')} className="link-btn">
              Login Here
            </button>
          </p>
        </div>
      </div>

      {/* Floating Medical Icons */}
      <div className="floating-icons">
        <div className="float-icon" style={{animationDelay: '0s'}}>💊</div>
        <div className="float-icon" style={{animationDelay: '2s'}}>🏥</div>
        <div className="float-icon" style={{animationDelay: '4s'}}>⚕️</div>
        <div className="float-icon" style={{animationDelay: '1s'}}>🩺</div>
        <div className="float-icon" style={{animationDelay: '3s'}}>📋</div>
      </div>
    </div>
  );
};

export default Login;