import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';

const APPOINTMENTS_KEY = 'patientAppointments';

const formatTimeLabel = (timeValue) => {
  if (!timeValue) return '';
  const [hours = '0', minutes = '0'] = (timeValue || '').split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getInitials = (name) => {
  if (!name) {
    return 'P';
  }
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

 useEffect(() => {
  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const resp = await axios.get('/api/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = resp.data || [];

      const now = new Date();

      const upcoming = data
        .filter((item) => item.status === 'APPROVED')
        .map((item) => {
          const patientName =
            item.patientName ||
            (item.patient && (item.patient.name || item.patient.fullName)) ||
            'Patient';

          const time = item.appointmentTime || item.time || '';

          const dateTime = new Date(
            `${item.appointmentDate}T${time}`
          );

          return {
            id: item.id,
            patientName,
            department: item.department || '',
            hospital: item.hospital || '',
            time,
            appointmentDate: item.appointmentDate,
            appointmentTime: time,
            dateTime,
            status: item.status
          };
        })
        .filter((item) => item.dateTime && item.dateTime >= now)
        .sort((a, b) => a.dateTime - b.dateTime);

      setTodayAppointments(upcoming);
    } catch (err) {
      console.error('Failed to load appointments', err);
      setTodayAppointments([]);
    }
  };

  loadAppointments();
}, []);


  useEffect(() => {
  const fetchDoctorProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/doctor/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const doctor = response.data;

      // Adjust field name based on your backend
      const name = doctor?.user?.name;

      setUserName(name || 'Doctor');
    } catch (error) {
      console.error('Failed to fetch doctor profile', error);
    }
  };

  fetchDoctorProfile();
}, []);


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/doctor-profile');
  };

  const handleNavClick = (event, link) => {
    if (link?.startsWith('/')) {
      event.preventDefault();
      navigate(link);
    }
  };

  const handleCardAction = (link) => {
    if (link?.startsWith('/')) {
      navigate(link);
    }
  };

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
      title: 'Patients',
      icon: '👥',
      color: '#0066cc',
      link: '/doctor-patient-registry'
    },
    {
      id: 2,
      title: 'Appointments',
      icon: '📅',
      color: '#00b8a9',
      link: '/doctor-bookings'
    },
    {
      id: 3,
      title: 'Schedule',
      icon: '🗓️',
      color: '#9b59b6',
      link: '#schedule'
    },
    {
      id: 4,
      title: 'Analytics',
      icon: '📈',
      color: '#f39c12',
      link: '#analytics'
    },
    {
      id: 5,
      title: 'Reports',
      icon: '📄',
      color: '#4f46e5',
      link: '#reports'
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

      <main className="dashboard-main">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="sidebar-header">
              <h2 className="sidebar-title">Doctor Console</h2>
              <p className="sidebar-subtitle">Quick access to daily tools</p>
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
              <p className="welcome-subtitle">Your patients, appointments, and clinical insights</p>
            </div>

            <section id="summary" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Quick overview</h2>
                  <p className="section-subtitle">Your day at a glance</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction('/doctor-profile')}>
                  View Profile
                </button>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">👥</div>
                  <div>
                    <p className="summary-label">Patients Today</p>
                    <h3 className="summary-value">18 Scheduled</h3>
                    <span className="summary-meta">6 walk-ins expected</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">📅</div>
                  <div>
                    <p className="summary-label">Next Appointment</p>
                    <h3 className="summary-value">10:30 AM</h3>
                    <span className="summary-meta">Dr. Clinic Room 2</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">📄</div>
                  <div>
                    <p className="summary-label">Pending Reports</p>
                    <h3 className="summary-value">7 Reports</h3>
                    <span className="summary-meta">3 urgent</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon" aria-hidden="true">❤️</div>
                  <div>
                    <p className="summary-label">On-call Status</p>
                    <h3 className="summary-value">Available</h3>
                    <span className="summary-meta status-good">Ready for consults</span>
                  </div>
                </div>
              </div>
            </section>

            <section id="appointments" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Upcoming appointments</h2>
                  <p className="section-subtitle">All upcoming approved appointments</p>
                </div>
                <div className="section-actions">
                  <button className="primary-btn" onClick={() => handleCardAction('/doctor-bookings')}>
                    Manage Appointments
                  </button>
                </div>
              </div>

              <div className="appointment-list today-appointments">
                {todayAppointments.length === 0 ? (
                  <article className="appointment-card">
                    <div className="appointment-details">
                      <h3>No confirmed appointments today</h3>
                      <p>Review pending requests to fill your schedule.</p>
                    </div>
                    <div className="appointment-actions">
                      <button className="primary-btn" onClick={() => handleCardAction('/doctor-bookings')}>
                        Manage Appointments
                      </button>
                    </div>
                  </article>
                ) : (
                  todayAppointments.map((appointment) => (
                    <article key={appointment.id} className="appointment-card today-card">
                      <div className="appointment-main">
                        <div className="appointment-details">
                          <div className="appointment-header-row">
                            <div className="appointment-patient">
                              <div className="patient-avatar" aria-hidden="true">
                                {getInitials(appointment.patientName)}
                              </div>
                              <h3>{appointment.patientName || 'Patient'}</h3>
                            </div>
                            <span className="time-pill">{formatTimeLabel(appointment.time)}</span>
                          </div>
                          <p>{appointment.department} • {appointment.hospital}</p>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <span className="status-badge confirmed">Confirmed</span>
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

            <section id="patients" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Patients requiring focus</h2>
                  <p className="section-subtitle">Priority follow-ups and care plans</p>
                </div>
                <button className="link-pill">View All Patients</button>
              </div>

              <div className="patients-list">
                <div className="patient-card">
                  <div>
                    <h3>Sameer Joshi</h3>
                    <p>Hypertension • Follow-up due today</p>
                  </div>
                  <div className="report-actions">
                    <span className="status-badge pending">Due Today</span>
                    <button className="ghost-btn">Message</button>
                    <button className="primary-btn">Open Profile</button>
                  </div>
                </div>
                <div className="patient-card">
                  <div>
                    <h3>Meera Patel</h3>
                    <p>Diabetes • Lab results review</p>
                  </div>
                  <div className="report-actions">
                    <span className="status-badge confirmed">Reviewed</span>
                    <button className="ghost-btn">Message</button>
                    <button className="primary-btn">Open Profile</button>
                  </div>
                </div>
                <div className="patient-card">
                  <div>
                    <h3>Nisha Verma</h3>
                    <p>General • Post-op check-in</p>
                  </div>
                  <div className="report-actions">
                    <span className="status-badge pending">Pending</span>
                    <button className="ghost-btn">Message</button>
                    <button className="primary-btn">Open Profile</button>
                  </div>
                </div>
              </div>
            </section>

            <section id="schedule" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Schedule blocks</h2>
                  <p className="section-subtitle">Manage clinic availability and telehealth slots</p>
                </div>
                <button className="link-pill">Edit Schedule</button>
              </div>

              <div className="schedule-grid">
                <div className="schedule-card">
                  <div>
                    <h3>Morning Clinic</h3>
                    <p>9:00 AM - 1:00 PM</p>
                  </div>
                  <span className="status-badge confirmed">Open</span>
                </div>
                <div className="schedule-card">
                  <div>
                    <h3>Teleconsult</h3>
                    <p>2:00 PM - 4:00 PM</p>
                  </div>
                  <span className="status-badge pending">Limited</span>
                </div>
                <div className="schedule-card">
                  <div>
                    <h3>Evening Rounds</h3>
                    <p>5:30 PM - 7:00 PM</p>
                  </div>
                  <span className="status-badge confirmed">Open</span>
                </div>
              </div>
            </section>

            <section id="analytics" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Health analytics</h2>
                  <p className="section-subtitle">Clinic performance indicators</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction('#analytics')}>
                  View Full Insights
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Patient Volume</span>
                    <span className="trend-indicator good">🟢 Rising</span>
                  </div>
                  <h3>128 Visits</h3>
                  <p className="analytics-meta">Last 7 days</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,28 20,24 40,22 60,18 80,16 100,14 120,10" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Average Wait Time</span>
                    <span className="trend-indicator warn">🟡 Needs focus</span>
                  </div>
                  <h3>18 mins</h3>
                  <p className="analytics-meta">Target under 15 mins</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,12 20,16 40,18 60,22 80,20 100,24 120,26" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Follow-up Rate</span>
                    <span className="trend-indicator good">🟢 Improving</span>
                  </div>
                  <h3>74%</h3>
                  <p className="analytics-meta">Monthly average</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,30 20,26 40,22 60,20 80,18 100,14 120,12" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Patient Satisfaction</span>
                    <span className="trend-indicator alert">🔴 Review</span>
                  </div>
                  <h3>4.2 / 5</h3>
                  <p className="analytics-meta">Last 30 days</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,20 20,18 40,16 60,18 80,22 100,24 120,26" />
                  </svg>
                </div>
              </div>
            </section>

            <section id="reports" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Reports</h2>
                  <p className="section-subtitle">Pending reviews and uploads</p>
                </div>
                <button className="link-pill">Create Report</button>
              </div>

              <div className="reports-list">
                <div className="report-item">
                  <div>
                    <h3>Lab Panel Review</h3>
                    <p>Sameer Joshi • Uploaded Feb 10</p>
                  </div>
                  <div className="report-actions">
                    <span className="report-status">Urgent</span>
                    <button className="ghost-btn">View PDF</button>
                    <button className="primary-btn">Approve</button>
                  </div>
                </div>
                <div className="report-item">
                  <div>
                    <h3>Radiology Summary</h3>
                    <p>Meera Patel • Uploaded Feb 7</p>
                  </div>
                  <div className="report-actions">
                    <span className="report-status">Ready</span>
                    <button className="ghost-btn">View PDF</button>
                    <button className="primary-btn">Approve</button>
                  </div>
                </div>
                <div className="report-item">
                  <div>
                    <h3>Prescription Update</h3>
                    <p>Nisha Verma • Uploaded Feb 2</p>
                  </div>
                  <div className="report-actions">
                    <span className="report-status muted">Draft</span>
                    <button className="ghost-btn">View PDF</button>
                    <button className="primary-btn">Finalize</button>
                  </div>
                </div>
              </div>
            </section>

            <section id="settings" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Settings</h2>
                  <p className="section-subtitle">Notifications, availability, and privacy</p>
                </div>
                <button className="link-pill">Open Settings</button>
              </div>

              <div className="settings-card">
                <div>
                  <h3>Availability</h3>
                  <p>Update clinic hours and teleconsulting slots.</p>
                </div>
                <button className="primary-btn">Manage</button>
              </div>
            </section>
          </div>
        </div>
      </main>

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
            <div className="stat-icon vital-good">✅</div>
            <div className="stat-info">
              <span className="stat-label">Today&apos;s Patients</span>
              <span className="stat-value">18</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🧾</div>
            <div className="stat-info">
              <span className="stat-label">Pending Reports</span>
              <span className="stat-value">7</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <span className="stat-label">Next Appointment</span>
              <span className="stat-value">10:30 AM</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default DoctorDashboard;
