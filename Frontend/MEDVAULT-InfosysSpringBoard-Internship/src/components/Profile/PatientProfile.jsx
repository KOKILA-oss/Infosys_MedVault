import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PatientProfile.css';

const REGISTRY_KEY = 'doctorPatientRegistry';

const createPatientKey = (patient) => {
  const email = (patient.email || '').trim().toLowerCase();
  if (email) return email;
  const name = (patient.username || patient.name || 'patient')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .join('-');
  const phone = (patient.phoneNumber || '').split(' ').join('');
  return `${name}-${phone || 'na'}`;
};

const parseRegistry = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const PatientProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    gender: '',
    bloodGroup: '',
    address: '',
    height: '',
    weight: '',
    sugarLevel: '',
    allergies: '',
    emergencyContact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [reportNote, setReportNote] = useState('');

  const patientKey = useMemo(() => createPatientKey(profile), [profile]);

  const reports = useMemo(() => {
    const registry = parseRegistry();
    const list = registry[patientKey]?.reports;
    return Array.isArray(list) ? list : [];
  }, [patientKey, profile]);

  const loadProfile = () => {
    const stored = localStorage.getItem('medvaultProfile');
    const parsed = stored ? JSON.parse(stored) : {};
    setProfile((prev) => ({
      ...prev,
      ...parsed
    }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = savedTheme;
    loadProfile();
  }, []);

  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get('tab');
    if (queryTab === 'reports') {
      setActiveTab('reports');
      return;
    }
    setActiveTab('profile');
  }, [location.search]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    localStorage.setItem('medvaultProfile', JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleCancel = () => {
    loadProfile();
    setIsEditing(false);
  };

  const displayValue = (value) => value || 'Not set';

  const handlePdfUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF reports.');
      return;
    }

    const registry = parseRegistry();
    const currentEntry = registry[patientKey] || {};

    const reader = new FileReader();
    reader.onload = () => {
      const report = {
        id: Date.now(),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        note: reportNote.trim(),
        dataUrl: typeof reader.result === 'string' ? reader.result : '',
        uploadedBy: 'patient'
      };

      const nextRegistry = {
        ...registry,
        [patientKey]: {
          ...currentEntry,
          profile: {
            ...currentEntry.profile,
            name: currentEntry.profile?.name || profile.username,
            email: currentEntry.profile?.email || profile.email,
            phoneNumber: currentEntry.profile?.phoneNumber || profile.phoneNumber
          },
          reports: [report, ...(Array.isArray(currentEntry.reports) ? currentEntry.reports : [])]
        }
      };

      localStorage.setItem(REGISTRY_KEY, JSON.stringify(nextRegistry));
      setReportNote('');
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-topbar">
          <div>
            <h1 className="profile-title">Patient Profile</h1>
            <p className="profile-subtitle">Review your health details</p>
          </div>
          <div className="profile-actions">
            <button type="button" className="secondary-btn" onClick={() => navigate('/patient-dashboard')}>
              Back to Dashboard
            </button>
            {activeTab === 'profile' ? (
              isEditing ? (
                <>
                  <button type="button" className="secondary-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="button" className="primary-btn" onClick={handleSave}>
                    Save Profile
                  </button>
                </>
              ) : (
                <button type="button" className="primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )
            ) : null}
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-tab-row">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
            <button
              type="button"
              className="tab-btn"
              onClick={() => navigate('/patient-bookings?tab=all')}
            >
              Appointments
            </button>
          </div>

          {activeTab === 'profile' ? (
            <>
              <div className="profile-section">
                <h2 className="section-title">Basic Info</h2>
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="profile-label">Full Name</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="username"
                        value={profile.username}
                        onChange={handleChange}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.username)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Email</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.email)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Phone Number</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="tel"
                        name="phoneNumber"
                        value={profile.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.phoneNumber)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="section-title">Health Details</h2>
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="profile-label">Gender</span>
                    {isEditing ? (
                      <select
                        className="profile-input"
                        name="gender"
                        value={profile.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                        <option value="prefer-not">Prefer not to say</option>
                      </select>
                    ) : (
                      <span className="profile-value">{displayValue(profile.gender)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Blood Group</span>
                    {isEditing ? (
                      <select
                        className="profile-input"
                        name="bloodGroup"
                        value={profile.bloodGroup}
                        onChange={handleChange}
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
                    ) : (
                      <span className="profile-value">{displayValue(profile.bloodGroup)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Height (cm)</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="number"
                        name="height"
                        value={profile.height}
                        onChange={handleChange}
                        min="0"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.height)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Weight (kg)</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="number"
                        name="weight"
                        value={profile.weight}
                        onChange={handleChange}
                        min="0"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.weight)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Sugar Level (mg/dL)</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="number"
                        name="sugarLevel"
                        value={profile.sugarLevel}
                        onChange={handleChange}
                        min="0"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.sugarLevel)}</span>
                    )}
                  </div>
                  <div className="profile-field full-width">
                    <span className="profile-label">Address</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="address"
                        value={profile.address}
                        onChange={handleChange}
                        placeholder="Street, City, State"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.address)}</span>
                    )}
                  </div>
                  <div className="profile-field full-width">
                    <span className="profile-label">Allergies</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="allergies"
                        value={profile.allergies}
                        onChange={handleChange}
                        placeholder="List any allergies"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.allergies)}</span>
                    )}
                  </div>
                  <div className="profile-field full-width">
                    <span className="profile-label">Emergency Contact</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="emergencyContact"
                        value={profile.emergencyContact}
                        onChange={handleChange}
                        placeholder="Name and phone number"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.emergencyContact)}</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="profile-section">
              <h2 className="section-title">Reports (PDF)</h2>
              <div className="report-upload-row">
                <input
                  className="profile-input"
                  type="text"
                  placeholder="Optional note for this report"
                  value={reportNote}
                  onChange={(event) => setReportNote(event.target.value)}
                />
                <label className="secondary-btn upload-btn">
                  Upload PDF
                  {' '}
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} />
                </label>
              </div>

              <div className="reports-list">
                {reports.length === 0 ? (
                  <p className="profile-value">No reports uploaded yet.</p>
                ) : (
                  reports.map((item) => (
                    <div className="report-item" key={item.id}>
                      <div>
                        <h3>{item.fileName || 'Report'}</h3>
                        <p>{item.note || 'No note'}</p>
                        <small className="report-date">Uploaded: {formatDateTime(item.uploadedAt)}</small>
                      </div>
                      <div className="report-actions">
                        {item.dataUrl ? (
                          <a className="secondary-btn" href={item.dataUrl} target="_blank" rel="noreferrer">
                            View PDF
                          </a>
                        ) : (
                          <span className="profile-subtitle">Preview unavailable</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
