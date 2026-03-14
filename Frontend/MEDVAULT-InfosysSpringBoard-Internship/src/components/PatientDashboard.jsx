import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientDashboard.css';

const REGISTRY_KEY = 'doctorPatientRegistry';

const defaultSettings = {
  dataSharingEnabled: false,
  chatbotEnabled: true,
  themePreference: 'light'
};

const parseStoredRegistry = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const createPatientKey = (patient) => {
  const email = (patient.email || '').trim().toLowerCase();
  if (email) return email;
  const name = (patient.username || patient.name || 'patient').trim().toLowerCase().split(' ').filter(Boolean).join('-');
  const phone = (patient.phoneNumber || '').split(' ').join('');
  return `${name}-${phone || 'na'}`;
};

const isReportsLink = (link) => typeof link === 'string' && link.includes('tab=reports');

const openInNewTab = (link) => {
  if (!link) return;
  const anchor = globalThis.document.createElement('a');
  anchor.href = link;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  globalThis.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const formatDateLabel = (dateValue) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTimeLabel = (timeValue) => {
  if (!timeValue) return '';
  const [hours, minutes] = timeValue.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// const formatReportDate = (dateValue) => {
//   if (!dateValue) return 'Uploaded recently';
//   const date = new Date(dateValue);
//   if (Number.isNaN(date.getTime())) return 'Uploaded recently';
//   return `Uploaded ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
// };

const PatientDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('Patient');
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [tips, setTips] = useState([]);
  // const unreadNotificationCount = 0;
  const [patientIdentity, setPatientIdentity] = useState({ name: '', email: '', phoneNumber: '' });
  const [registryData, setRegistryData] = useState({});
  const [settings, setSettings] = useState(defaultSettings);
  // const [settingsStatus, setSettingsStatus] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    if (storedName?.trim()) {
      setUserName(storedName.trim());
      return;
    }
    if (storedEmail?.includes('@')) {
      setUserName(storedEmail.split('@')[0]);
    }
  }, []);

  useEffect(() => {
    const loadRegistry = () => setRegistryData(parseStoredRegistry());
    loadRegistry();
    globalThis.addEventListener('focus', loadRegistry);
    globalThis.addEventListener('storage', loadRegistry);
    return () => {
      globalThis.removeEventListener('focus', loadRegistry);
      globalThis.removeEventListener('storage', loadRegistry);
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  useEffect(() => {}, [token]);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        if (!token) return;
        const response = await axios.get('/api/patient/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const patient = response.data;
        const mergedPatient = {
          name: patient?.user?.name || patient?.name || patient?.fullName || '',
          email: patient?.user?.email || patient?.email || '',
          phoneNumber: patient?.phoneNumber || patient?.user?.phoneNumber || ''
        };
        setPatientIdentity(mergedPatient);
        if (mergedPatient.name) setUserName(mergedPatient.name);
      } catch (error) {
        console.error('Failed to fetch patient profile', error);
      }
    };

    fetchPatientProfile();
  }, [token]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        if (!token) return;
        const resp = await axios.get('/api/patient/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = Array.isArray(resp.data) ? resp.data : [];
        setAppointments(list);
      } catch (error) {
        console.error('Failed to load appointments', error);
        setAppointments([]);
      }
    };

    loadAppointments();
  }, [token]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        if (!token) return;
        const resp = await axios.get('/api/patient/records', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(resp.data) ? resp.data : [];
        setReports(data.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      } catch (error) {
        console.error('Failed to load reports', error);
        setReports([]);
      }
    };

    loadReports();
  }, [token]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!token) return;
        const response = await axios.get('/api/patient/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const nextSettings = { ...defaultSettings, ...(response.data || {}) };
        setSettings(nextSettings);
        const preferredTheme = nextSettings.themePreference || 'light';
        setTheme(preferredTheme);
        localStorage.setItem('theme', preferredTheme);
        document.documentElement.dataset.theme = preferredTheme;
      } catch (error) {
        console.error('Failed to load patient settings', error);
      }
    };

    const loadTips = async () => {
      try {
        if (!token) return;
        const response = await axios.get('/api/patient/tips', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTips(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to load patient tips', error);
        setTips([]);
      }
    };

    loadSettings();
    loadTips();
  }, [token]);

  const effectivePatientIdentity = useMemo(() => {
    let storedProfile = {};
    try {
      storedProfile = JSON.parse(localStorage.getItem('medvaultProfile') || '{}');
    } catch {
      storedProfile = {};
    }

    return {
      name: patientIdentity.name || storedProfile.username || storedProfile.name || userName || 'Patient',
      email: patientIdentity.email || storedProfile.email || '',
      phoneNumber: patientIdentity.phoneNumber || storedProfile.phoneNumber || ''
    };
  }, [patientIdentity, userName]);

  const patientKey = useMemo(() => createPatientKey(effectivePatientIdentity), [effectivePatientIdentity]);

  const patientReports = useMemo(() => {
    const list = registryData[patientKey]?.reports;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => new Date(b?.uploadedAt || 0) - new Date(a?.uploadedAt || 0));
  }, [patientKey, registryData]);

  // const latestReport = patientReports[0] || reports[0] || null;

  // const nextAppointment = useMemo(() => appointments
  //   .filter((item) => item.status !== 'CANCELLED')
  //   .map((item) => ({ ...item, dateTime: new Date(`${item.appointmentDate}T${item.appointmentTime || '00:00'}`) }))
  //   .filter((item) => !Number.isNaN(item.dateTime.getTime()) && item.dateTime >= new Date())
  //   .sort((a, b) => a.dateTime - b.dateTime)[0], [appointments]);

  const upcomingAppointments = useMemo(() => appointments
    .filter((item) => item.status !== 'CANCELLED')
    .map((item) => ({ ...item, dateTime: new Date(`${item.appointmentDate}T${item.appointmentTime || '00:00'}`) }))
    .filter((item) => !Number.isNaN(item.dateTime.getTime()) && item.dateTime >= new Date())
    .sort((a, b) => a.dateTime - b.dateTime)
    .slice(0, 3), [appointments]);

  // const latestReason = useMemo(() => appointments.find((item) => item.reason)?.reason || 'No booking reason added yet', [appointments]);
  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    setSettings((prev) => ({ ...prev, themePreference: newTheme }));
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    if (!token) return;
    try {
      await axios.put('/api/patient/settings', { ...settings, themePreference: newTheme }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const handleProfileClick = () => navigate('/patient-profile');
  const handleLogout = () => navigate('/');
  const handleNavClick = (event, link) => {
    if (link?.startsWith('/')) {
      event.preventDefault();
      navigate(link);
    }
  };
  const handleCardAction = (link) => {
    if (link?.startsWith('/')) {
      return navigate(link);
    }
    if (link?.startsWith('#')) {
      const target = document.querySelector(link);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onDownloadReport = async (recordId, fileName) => {
    try {
      if (!token) return;
      const response = await axios.get(`/api/patient/records/${recordId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'record';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download report', error);
    }
  };

  const handleViewReport = (report) => {
    if (report?.dataUrl) return openInNewTab(report.dataUrl);
    navigate('/patient-profile?tab=reports');
  };

  const handleDownloadReport = (report) => {
    if (!report?.dataUrl) return navigate('/patient-profile?tab=reports');
    const anchor = globalThis.document.createElement('a');
    anchor.href = report.dataUrl;
    anchor.download = report.fileName || 'report.pdf';
    anchor.style.display = 'none';
    globalThis.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };



  const dashboardCards = [
    { id: 0, title: 'Registery file', icon: '✨', color: '#3b82f6', link: '/patient-registry-file' },
    { id: 1, title: 'Appointments', icon: '📅', color: '#0066cc', link: '/patient-bookings?tab=all' },
    { id: 2, title: 'Reports', icon: '📄', color: '#9b59b6', link: '/patient-profile?tab=reports' },
    { id: 3, title: 'Tips', icon: '💡', color: '#f39c12', link: '#tips' },
    { id: 4, title: 'Ratings & Reviews', icon: '⭐', color: '#f39c12', link: '/patient-ratings-reviews' }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon-small">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-title">MedVault</span>
          </div>

          <div className="header-actions">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
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

            <div className="user-menu">
              <button type="button" className="user-avatar" onClick={handleProfileClick} title="Profile">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              {/* Notifications removed for patients */}
              <button onClick={handleLogout} className="logout-btn" title="Logout">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Patient Hub</h2>
              <p className="sidebar-subtitle">Your care at a glance</p>
            </div>
            <nav className="sidebar-nav">
              {dashboardCards.map((card) => (
                <a
                  key={card.id}
                  className="sidebar-item"
                  href={card.link}
                  target={isReportsLink(card.link) ? '_blank' : undefined}
                  rel={isReportsLink(card.link) ? 'noopener noreferrer' : undefined}
                  onClick={(event) => handleNavClick(event, card.link)}
                >
                  <span className="sidebar-icon" style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` }}>
                    {card.icon}
                  </span>
                  <span className="sidebar-label">{card.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="dashboard-content">
            <div className="dashboard-welcome">
              <h1 className="welcome-title">Welcome back, {userName} 👋</h1>
              <p className="welcome-subtitle">Your care, appointments, reports, and personalized tips in one place</p>
            </div>

            <section id="appointments" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Upcoming appointments</h2>
                  <p className="section-subtitle">Priority visits and actions</p>
                </div>
                <div className="section-actions">
                  <button className="link-pill" onClick={() => handleCardAction('/patient-bookings?tab=all')}>See All</button>
                  <button className="primary-btn" onClick={() => handleCardAction('/patient-bookings?tab=book')}>Book Appointment</button>
                </div>
              </div>

              <div className="appointment-list">
                {upcomingAppointments.length === 0 ? (
                  <article className="appointment-card">
                    <div className="appointment-details">
                      <h3>No upcoming appointments</h3>
                      <p>Book a visit to get started.</p>
                    </div>
                    <div className="appointment-actions">
                      <button className="primary-btn" onClick={() => handleCardAction('/patient-bookings?tab=book')}>Book Appointment</button>
                    </div>
                  </article>
                ) : upcomingAppointments.map((appointment) => (
                  <article key={appointment.id} className="appointment-card">
                    <div className="appointment-main">
                      <div className="appointment-time">
                        <span className="appointment-date">{formatDateLabel(appointment.appointmentDate)}</span>
                        <span className="appointment-hour">{formatTimeLabel(appointment.appointmentTime)}</span>
                        <span className="appointment-flag">Upcoming</span>
                      </div>
                      <div className="appointment-details">
                        <h3>{appointment.doctorName || 'Doctor'}</h3>
                        <p>{appointment.department || 'Consultation'} • {appointment.hospital || 'MedVault Care'}</p>
                        {appointment.reason ? <p>Reason: {appointment.reason}</p> : null}
                      </div>
                    </div>
                    <div className="appointment-actions">
                      <span className={`status-badge ${appointment.status === 'APPROVED' ? 'confirmed' : appointment.status === 'PENDING' ? 'pending' : 'cancelled'}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="reports" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Reports</h2>
                  <p className="section-subtitle">Latest uploads and quick access</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction('/patient-profile?tab=reports')}>Upload Report</button>
              </div>

              <div className="reports-list">
                {patientReports.length === 0 && reports.length === 0 ? (
                  <div className="report-item">
                    <div>
                      <h3>No reports uploaded yet</h3>
                      <p>Add reports from the Reports tab to view them here.</p>
                    </div>
                    <div className="report-actions">
                      <span className="report-status muted">No Data</span>
                      <button className="primary-btn" onClick={() => navigate('/patient-profile?tab=reports')}>Go to Reports</button>
                    </div>
                  </div>
                ) : (patientReports.length > 0 ? patientReports.slice(0, 3) : reports.slice(0, 3)).map((item) => (
                  <div className="report-item" key={item.id || `${item.fileName}-${item.uploadedAt || item.createdAt}`}>
                    <div>
                      <h3>{item.fileName || item.title || 'Report'}</h3>
                      <p>{(item.note || item.uploadedBy || 'Report')} • Uploaded {formatDateTime(item.uploadedAt || item.createdAt)}</p>
                    </div>
                    <div className="report-actions">
                      <span className={`report-status ${item.uploadedAt && !item.dataUrl ? 'muted' : ''}`}>
                        {item.uploadedAt ? (item.dataUrl ? 'Ready' : 'Unavailable') : 'Ready'}
                      </span>
                      <button className="ghost-btn" onClick={() => (item.uploadedAt ? handleViewReport(item) : handleCardAction('/patient-medical-records'))}>
                        {item.uploadedAt ? 'View PDF' : 'View'}
                      </button>
                      <button className="primary-btn" onClick={() => (item.uploadedAt ? handleDownloadReport(item) : onDownloadReport(item.id, item.fileName))}>
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="tips" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Personalized precautions & tips</h2>
                  <p className="section-subtitle">Generated from your appointment booking reasons</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction('/patient-bookings?tab=book')}>Add New Reason</button>
              </div>

              <div className="tips-grid">
                {tips.length === 0 ? (
                  <div className="tip-card">
                    <span className="tip-icon">💡</span>
                    <div>
                      <h3>No tips yet</h3>
                      <p>Book an appointment with a clear reason to get personalized suggestions here.</p>
                    </div>
                  </div>
                ) : tips.map((tip, index) => (
                  <div className="tip-card" key={`${tip.title}-${index}`}>
                    <span className="tip-icon">💡</span>
                    <div>
                      <h3>{tip.title}</h3>
                      <p>{tip.description}</p>
                      {tip.matchedReason ? <small className="summary-meta">Based on: {tip.matchedReason}</small> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Settings section removed */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;

