import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import axios from "axios";


const Signup = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [step, setStep] = useState(1);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpStatusMessage, setOtpStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phoneNumber: '',
    gender: '',
    bloodGroup: '',
    address: '',
    height: '',
    weight: '',
    sugarLevel: '',
    allergies: '',
    emergencyContact: '',
    specialization: '',
    experienceYears: '',
    qualification: '',
    licenseNumber: '',
    hospitalName: '',
    hospitalAddress: '',
    consultationMode: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setOtpStatusMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (step === 1) {
      if (!e.currentTarget.checkValidity()) {
        e.currentTarget.reportValidity();
        return;
      }
      setStep(2);
      return;
    }

    try {
      setIsSendingOtp(true);
      setOtpStatusMessage('OTP sending...');

      await axios.post("/api/auth/register/request-otp", {
        email: formData.email
      });

      setOtpStatusMessage('OTP sent. Redirecting to verification...');

      // Navigate to OTP page and pass entire form data
      navigate('/otp-verify', {
        state: {
          type: "register",
          userData: formData
        }
      });
    } catch (error) {
      setOtpStatusMessage('');
      setErrorMessage(error?.response?.data || 'Unable to send OTP. Please try again.');
      console.error("OTP request failed:", error);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleBack = () => {
    setStep(1);
  };



  return (
    <div className="signup-container">
      <div className="medical-bg">
        <div className="pulse-circle"></div>
        <div className="pulse-circle"></div>
      </div>

      <div className="signup-card">
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
        <div className="signup-header">
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
          <p className="signup-subtitle">Create Your Health Account</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form" noValidate>
          <div className="signup-layout">
            <aside className="signup-role-column">
              <div className="role-selection">
                <label className="role-label">I am a:</label>
                <div className="role-options">
                  <label className={`role-card ${formData.role === 'patient' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="patient"
                      checked={formData.role === 'patient'}
                      onChange={handleChange}
                    />
                    <div className="role-icon">👤</div>
                    <span className="role-name">Patient</span>
                  </label>

                  <label className={`role-card ${formData.role === 'doctor' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="doctor"
                      checked={formData.role === 'doctor'}
                      onChange={handleChange}
                    />
                    <div className="role-icon">⚕️</div>
                    <span className="role-name">Doctor</span>
                  </label>

                  <label className={`role-card ${formData.role === 'admin' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={handleChange}
                    />
                    <div className="role-icon">🛡️</div>
                    <span className="role-name">Admin</span>
                  </label>
                </div>
              </div>
            </aside>

            <section className="signup-main-column">
              <div className="form-stepper">
                <div className={`step-item ${step === 1 ? 'active' : 'complete'}`}>
                  <span className="step-badge">1</span>
                  <span className="step-label">Basic Info</span>
                </div>
                <div className={`step-line ${step === 2 ? 'active' : ''}`}></div>
                <div className={`step-item ${step === 2 ? 'active' : ''}`}>
                  <span className="step-badge">2</span>
                  <span className="step-label">Details</span>
                </div>
              </div>

              {step === 1 && (
                <div className="details-grid basic-grid">
              <div className="form-group">
                <label htmlFor="username">
                  {formData.role === 'admin' ? 'Admin Root Username' : 'Username'}
                </label>
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
                    placeholder={formData.role === 'admin' ? 'Enter admin root username' : 'Choose a username'}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
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
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
                </div>
              )}

              {step === 2 && (
                <div className="details-grid">
                  {formData.role !== 'admin' && (
                    <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number 📞</label>
                  <div className="input-wrapper plain">
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                    </div>
                  )}

                  {formData.role === 'patient' ? (
                    <>
                  <div className="form-group">
                    <label htmlFor="gender">Gender 🧑</label>
                    <div className="input-wrapper plain">
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                        <option value="prefer-not">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bloodGroup">Blood Group 🩸</label>
                    <div className="input-wrapper plain">
                      <select
                        id="bloodGroup"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="address">Address 🏠</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Street, City, State"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="height">Height (cm) 📏</label>
                    <div className="input-wrapper plain">
                      <input
                        type="number"
                        id="height"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="e.g. 170"
                        min="0"
                        step="0.1"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="weight">Weight (kg) ⚖️</label>
                    <div className="input-wrapper plain">
                      <input
                        type="number"
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="e.g. 70"
                        min="0"
                        step="0.1"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sugarLevel">Sugar Level (mg/dL) 🍬</label>
                    <div className="input-wrapper plain">
                      <input
                        type="number"
                        id="sugarLevel"
                        name="sugarLevel"
                        value={formData.sugarLevel}
                        onChange={handleChange}
                        placeholder="e.g. 110"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="allergies">Allergies 🤧</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="allergies"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="List any allergies"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="emergencyContact">Emergency Contact 🚨</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="emergencyContact"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        placeholder="Name and phone number"
                      />
                    </div>
                  </div>
                    </>
                  ) : formData.role === 'doctor' ? (
                    <>
                  <div className="form-group">
                    <label htmlFor="specialization">Specialization 🩺</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        placeholder="Cardiologist, Dentist, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="experienceYears">Experience (Years) 🕒</label>
                    <div className="input-wrapper plain">
                      <input
                        type="number"
                        id="experienceYears"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        placeholder="e.g. 8"
                        min="0"
                        step="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="qualification">Qualification 🎓</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="qualification"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        placeholder="MBBS, MD, MS"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseNumber">License Number 🪪</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        placeholder="Registration number"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hospitalName">Hospital Name 🏥</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="hospitalName"
                        name="hospitalName"
                        value={formData.hospitalName}
                        onChange={handleChange}
                        placeholder="Hospital or clinic"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="consultationMode">Consultation Mode 💬</label>
                    <div className="input-wrapper plain">
                      <select
                        id="consultationMode"
                        name="consultationMode"
                        value={formData.consultationMode}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select mode</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="hospitalAddress">Hospital Address 📍</label>
                    <div className="input-wrapper plain">
                      <input
                        type="text"
                        id="hospitalAddress"
                        name="hospitalAddress"
                        value={formData.hospitalAddress}
                        onChange={handleChange}
                        placeholder="Street, City, State"
                        required
                      />
                    </div>
                  </div>
                    </>
                  ) : (
                    <div className="form-group full-width">
                      <label htmlFor="hospitalName">Hospital Name 🏥</label>
                      <div className="input-wrapper plain">
                        <input
                          type="text"
                          id="hospitalName"
                          name="hospitalName"
                          value={formData.hospitalName}
                          onChange={handleChange}
                          placeholder="Enter hospital name"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                {step === 2 && (
                  <button type="button" className="secondary-btn" onClick={handleBack} disabled={isSendingOtp}>
                    Back
                  </button>
                )}
                <button type="submit" className="signup-btn" disabled={isSendingOtp}>
                  <span>{step === 1 ? 'Next' : (isSendingOtp ? 'OTP sending...' : 'Create Account')}</span>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {otpStatusMessage && <p className="otp-status">{otpStatusMessage}</p>}
              {errorMessage && <p className="auth-error">{errorMessage}</p>}
            </section>
          </div>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?
            {' '}
            <button onClick={() => navigate('/login')} className="link-btn">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;