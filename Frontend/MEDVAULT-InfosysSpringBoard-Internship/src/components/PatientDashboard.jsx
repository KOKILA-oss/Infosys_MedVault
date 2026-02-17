import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PatientDashboard.css';
import axios from 'axios';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [appointments, setAppointments] = useState([]);

   useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/patient/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const patient = response.data;

       setUserName(
  patient?.user?.name ||
  patient?.name ||
  patient?.fullName ||
  'Patient'
);


      } catch (error) {
        console.error('Failed to fetch patient profile', error);
        setUserName('Patient');
      }
    };

    fetchPatientProfile();
  }, []);

  useEffect(() => {
  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const resp = await axios.get('/api/appointments/patient', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = resp.data || [];

      setAppointments(data);

    } catch (error) {
      console.error('Failed to load appointments', error);
      setAppointments([]);
    }
  };

  loadAppointments();
}, []);


  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/patient-profile');
  };

  const handleNavClick = (event, link) => {
    if (link && link.startsWith('/')) {
      event.preventDefault();
      navigate(link);
    }
  };

  const handleCardAction = (link) => {
    if (link && link.startsWith('/')) {
      navigate(link);
    }
  };

  const formatDateLabel = (dateValue) => {
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeLabel = (timeValue) => {
  if (!timeValue) return '';
  const [hours, minutes] = timeValue.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};


 const upcomingAppointments = appointments
  .filter((item) => item.status !== 'REJECTED')
  .map((item) => ({
    ...item,
    dateTime: new Date(
      `${item.appointmentDate}T${item.appointmentTime}`
    )
  }))
  .sort((a, b) => a.dateTime - b.dateTime)
  .slice(0, 3);

  const nextAppointment = appointments
  .filter(item => item.status !== 'REJECTED')
  .map(item => ({
    ...item,
    dateTime: new Date(`${item.appointmentDate}T${item.appointmentTime}`)
  }))
  .filter(item => item.dateTime >= new Date())
  .sort((a, b) => a.dateTime - b.dateTime)[0];


  const dashboardCards = [
    {
      id: 0,
      title: 'Overview',
      icon: '✨',
      color: '#3b82f6',
      link: '#summary'
    },
    {
      id: 1,
      title: 'Appointments',
      icon: '📅',
      color: '#0066cc',
      link: '#appointments'
    },
    {
      id: 2,
      title: 'Health Analytics',
      icon: '📈',
      color: '#00b8a9',
      link: '#analytics'
    },
    {
      id: 3,
      title: 'Reports',
      icon: '📄',
      color: '#9b59b6',
      link: '#reports'
    },
    {
      id: 4,
      title: 'Tips',
      icon: '💡',
      color: '#f39c12',
      link: '#tips'
    },
    {
      id: 5,
      title: 'Ratings & Reviews',
      icon: '⭐',
      color: '#f39c12',
      link: '/patient-ratings-reviews'
    },
    {
      id: 6,
      title: 'Settings',
      icon: '⚙️',
      color: '#34495e',
      link: '#settings'
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
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
            {/* Theme Toggle */}
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

            {/* User Menu */}
            <div className="user-menu">
              <button type="button" className="user-avatar" onClick={handleProfileClick} title="Profile">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              <button className="notification-btn" title="Notifications" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 0 0 6 8C6 14 4 16 4 16H20C20 16 18 14 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
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

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Patient Hub</h2>
              <p className="sidebar-subtitle">Your care at a glance</p>
            </div>
            <nav className="sidebar-nav">
              {dashboardCards.map((card) => (
                <a key={card.id} className="sidebar-item" href={card.link} onClick={(event) => handleNavClick(event, card.link)}>
                  <span
                    className="sidebar-icon"
                    style={{
                      background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`
                    }}
                  >
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
              <p className="welcome-subtitle">Your care, appointments, and health insights in one place</p>
            </div>

            <section id="summary" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Quick overview</h2>
                  <p className="section-subtitle">At-a-glance essentials for today</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction('/patient-profile')}>
                  View Profile
                </button>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">🧑‍⚕️</div>
                  <div>
                    <p className="summary-label">Assigned Doctor</p>
                    <h3 className="summary-value">
  {nextAppointment?.doctorName || 'Not Assigned'}
</h3>
<span className="summary-meta">
  {nextAppointment ? nextAppointment.status : 'No upcoming appointment'}
</span>

                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">📅</div>
                  <div>
                    <p className="summary-label">Upcoming Appointment</p>
                    {nextAppointment ? (
  <>
    <h3 className="summary-value">
      {formatDateLabel(nextAppointment.appointmentDate)},{" "}
      {formatTimeLabel(nextAppointment.appointmentTime)}
    </h3>
    <span className="summary-meta">
      {nextAppointment.status}
    </span>
  </>
) : (
  <>
    <h3 className="summary-value">No upcoming</h3>
    <span className="summary-meta">Book an appointment</span>
  </>
)}

                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">📄</div>
                  <div>
                    <p className="summary-label">Latest Report</p>
                    <h3 className="summary-value">Blood Work</h3>
                    <span className="summary-meta">Uploaded 2 days ago</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">❤️</div>
                  <div>
                    <p className="summary-label">Health Status</p>
                    <h3 className="summary-value">Stable</h3>
                    <span className="summary-meta status-good">On track</span>
                  </div>
                </div>
              </div>
            </section>

            <section id="appointments" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Upcoming appointments</h2>
                  <p className="section-subtitle">Priority visits and actions</p>
                </div>
                <div className="section-actions">
                  <button className="link-pill" onClick={() => handleCardAction('/patient-bookings?tab=all')}>
                    See All
                  </button>
                  <button className="primary-btn" onClick={() => handleCardAction('/patient-bookings?tab=book')}>
                    Book Appointment
                  </button>
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
                      <button className="primary-btn" onClick={() => handleCardAction('/patient-bookings?tab=book')}>
                        Book Appointment
                      </button>
                    </div>
                  </article>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <article key={appointment.id} className="appointment-card">
                      <div className="appointment-main">
                        <div className="appointment-time">
                          <span className="appointment-date">{formatDateLabel(appointment.appointmentDate)}</span>
                          <span className="appointment-hour">{formatTimeLabel(appointment.appointmentTime)}</span>
                          <span className="appointment-flag">Upcoming</span>
                        </div>
                        <div className="appointment-details">
                          <h3>{appointment.doctorName || 'Doctor'}</h3>
                          <p>{appointment.department} • {appointment.hospital}</p>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <span className={`status-badge ${appointment.status === 'pending' ? 'pending' : 'confirmed'}`}>
                          {appointment.status}
                        </span>
                        <div className="action-buttons">
                          <button className="ghost-btn">Reschedule</button>
                          <button className="danger-btn">Cancel</button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section id="analytics" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Health analytics</h2>
                  <p className="section-subtitle">Trends from recent vitals</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction('#analytics')}>
                  View Full Insights
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Blood Pressure</span>
                    <span className="trend-indicator good">🟢 Stable</span>
                  </div>
                  <h3>118/76</h3>
                  <p className="analytics-meta">Last 7 days</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,28 20,20 40,22 60,16 80,18 100,12 120,14" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Sugar Level</span>
                    <span className="trend-indicator warn">🟡 Watch</span>
                  </div>
                  <h3>132 mg/dL</h3>
                  <p className="analytics-meta">Fasting average</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,20 20,22 40,18 60,26 80,24 100,22 120,28" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Weight Progress</span>
                    <span className="trend-indicator good">🟢 Improving</span>
                  </div>
                  <h3>71.2 kg</h3>
                  <p className="analytics-meta">-1.4 kg this month</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,12 20,16 40,18 60,20 80,24 100,26 120,30" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Heart Rate</span>
                    <span className="trend-indicator alert">🔴 Elevated</span>
                  </div>
                  <h3>98 bpm</h3>
                  <p className="analytics-meta">Resting average</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,30 20,26 40,18 60,22 80,14 100,20 120,16" />
                  </svg>
                </div>
              </div>
            </section>

            <section id="reports" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Reports</h2>
                  <p className="section-subtitle">Latest uploads and quick access</p>
                </div>
                <button className="link-pill">Upload Report</button>
              </div>

              <div className="reports-list">
                <div className="report-item">
                  <div>
                    <h3>Complete Blood Count</h3>
                    <p>Lab • Uploaded Feb 10</p>
                  </div>
                  <div className="report-actions">
                    <span className="report-status">Ready</span>
                    <button className="ghost-btn">View PDF</button>
                    <button className="primary-btn">Download</button>
                  </div>
                </div>
                <div className="report-item">
                  <div>
                    <h3>Chest X-Ray</h3>
                    <p>X-ray • Uploaded Feb 5</p>
                  </div>
                  <div className="report-actions">
                    <span className="report-status">Ready</span>
                    <button className="ghost-btn">View PDF</button>
                    <button className="primary-btn">Download</button>
                  </div>
                </div>
                <div className="report-item">
                  <div>
                    <h3>Prescription Update</h3>
                    <p>Prescription • Uploaded Jan 30</p>
                  </div>
                  <div className="report-actions">
                    <span className="report-status muted">Processing</span>
                    <button className="ghost-btn">View PDF</button>
                    <button className="primary-btn">Download</button>
                  </div>
                </div>
              </div>
            </section>

            <section id="tips" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Personalized precautions & tips</h2>
                  <p className="section-subtitle">Daily reminders curated for you</p>
                </div>
                <button className="link-pill">Update Preferences</button>
              </div>

              <div className="tips-grid">
                <div className="tip-card">
                  <span className="tip-icon">🥗</span>
                  <div>
                    <h3>Avoid high salt intake</h3>
                    <p>Stay under 5g of sodium today.</p>
                  </div>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">💧</span>
                  <div>
                    <h3>Drink 2L of water</h3>
                    <p>Hydration helps stabilize vitals.</p>
                  </div>
                </div>
                <div className="tip-card">
                  <span className="tip-icon">💊</span>
                  <div>
                    <h3>Take medicine at 8 PM</h3>
                    <p>Next dose scheduled for tonight.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="settings" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Settings</h2>
                  <p className="section-subtitle">Manage notifications, privacy, and data sharing</p>
                </div>
                <button className="link-pill">Open Settings</button>
              </div>

              <div className="settings-card">
                <div>
                  <h3>Notifications</h3>
                  <p>Control alerts for appointments, reports, and reminders.</p>
                </div>
                <button className="primary-btn">Manage</button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Health Stats Bar */}
      {showStats && (
        <aside className="health-stats">
          <button
            type="button"
            className="stats-close"
            aria-label="Minimize quick summary"
            onClick={() => setShowStats(false)}
          >
            ✕
          </button>
          <div className="stat-item">
            <div className="stat-icon vital-good">💚</div>
            <div className="stat-info">
              <span className="stat-label">Overall Health</span>
              <span className="stat-value">Good</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🩺</div>
            <div className="stat-info">
              <span className="stat-label">Last Checkup</span>
              <span className="stat-value">2 weeks ago</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">💊</div>
            <div className="stat-info">
              <span className="stat-label">Medications</span>
              <span className="stat-value">3 Active</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default PatientDashboard;