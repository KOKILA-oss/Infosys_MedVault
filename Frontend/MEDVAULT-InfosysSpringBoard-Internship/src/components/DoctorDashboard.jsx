import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';

const APPOINTMENTS_KEY = 'patientAppointments';
const DOCTOR_LEAVE_DATES_KEY = 'doctorLeaveDates';
const REVIEWS_KEY = 'patientDoctorRatings';

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

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseStoredLeaveDates = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DOCTOR_LEAVE_DATES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseStoredRatings = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [approvedCountByDate, setApprovedCountByDate] = useState({});
  const [leaveDates, setLeaveDates] = useState([]);
  const [showInsightsPreview, setShowInsightsPreview] = useState(false);

  useEffect(() => {
    setLeaveDates(parseStoredLeaveDates());
  }, []);

  useEffect(() => {
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const resp = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnreadNotificationCount(resp.data || 0);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  fetchUnreadCount();

  // Optional: refresh every 10 seconds
  const interval = setInterval(fetchUnreadCount, 10000);

  return () => clearInterval(interval);
}, []);

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

      const resp = await axios.get('/api/doctor/appointments', {
  headers: { Authorization: `Bearer ${token}` }
});
      const data = resp.data || [];
      setAllAppointments(Array.isArray(data) ? data : []);

      const approvedCounts = data.reduce((acc, item) => {
        if ((item.status || '').toUpperCase() !== 'APPROVED' || !item.appointmentDate) return acc;
        acc[item.appointmentDate] = (acc[item.appointmentDate] || 0) + 1;
        return acc;
      }, {});
      setApprovedCountByDate(approvedCounts);

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
      setAllAppointments([]);
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

  const calendarModel = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ type: 'blank', key: `blank-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      cells.push({
        type: 'day',
        key: dateKey,
        day,
        dateKey,
        isBusy: leaveDates.includes(dateKey),
        approvedCount: approvedCountByDate[dateKey] || 0,
        isToday: dateKey === formatDateKey(new Date())
      });
    }

    return {
      monthLabel: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      cells
    };
  }, [leaveDates, approvedCountByDate]);


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
      link: '/doctor-schedule'
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
      link: '/doctor-reports'
    },
    {
      id: 6,
      title: 'Settings',
      icon: '⚙️',
      color: '#34495e',
      link: '#settings'
    }
  ];

  const analyticsMetrics = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateKey(now);

    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const monthStart = new Date(now);
    monthStart.setHours(0, 0, 0, 0);
    monthStart.setDate(monthStart.getDate() - 29);

    const appointmentDates = allAppointments
      .filter((item) => (item?.status || '').toUpperCase() !== 'REJECTED' && item?.appointmentDate)
      .map((item) => new Date(`${item.appointmentDate}T00:00:00`))
      .filter((date) => !Number.isNaN(date.getTime()));

    const dailyAppointments = appointmentDates.filter((date) => formatDateKey(date) === todayKey).length;
    const lastWeekAppointments = appointmentDates.filter((date) => date >= weekStart && date <= now).length;
    const oneMonthAppointments = appointmentDates.filter((date) => date >= monthStart && date <= now).length;

    const ratings = Object.values(parseStoredRatings())
      .map((item) => Number(item?.rating || 0))
      .filter((value) => value > 0);

    const avgRating = ratings.length
      ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)
      : '0.0';

    return {
      dailyAppointments,
      lastWeekAppointments,
      oneMonthAppointments,
      avgRating,
      totalRatings: ratings.length
    };
  }, [allAppointments]);

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
              <button
                className="notification-btn"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8A6 6 0 0 0 6 8C6 14 4 16 4 16H20C20 16 18 14 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unreadNotificationCount > 0 && (
                  <span className="notification-badge" aria-label={`${unreadNotificationCount} unread notifications`}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
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
                              <div>
  <h3>{appointment.patientName || 'Patient'}</h3>
  <p className="appointment-date">
    {appointment.appointmentDate}
  </p>
</div>
                            </div>
                            <span className="time-pill">{formatTimeLabel(appointment.time)}</span>
                          </div>
                          <p>{appointment.department} • {appointment.hospital}</p>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <span className="status-badge confirmed">Confirmed</span>
                        <div className="action-buttons">
                          <button
  type="button"
  className="ghost-btn"
  onClick={() => navigate(`/doctor-appointments/reschedule?id=${appointment.id}`)}
>
  Reschedule
</button>
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
                  <h2 className="section-title">Schedule</h2>
                  <p className="section-subtitle">Monthly preview of busy days and approved appointments count</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction('/doctor-schedule')}>
                  Edit Schedule
                </button>
              </div>

              <div className="calendar-card mini-calendar">
                <div className="calendar-head">
                  <h3>{calendarModel.monthLabel}</h3>
                  <p>Read-only preview. Use Edit Schedule to update leave days.</p>
                </div>

                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="calendar-grid">
                  {calendarModel.cells.map((cell) =>
                    cell.type === 'blank' ? (
                      <div key={cell.key} className="calendar-cell blank" />
                    ) : (
                      <div
                        key={cell.key}
                        className={`calendar-cell day ${cell.isBusy ? 'busy' : ''} ${cell.isToday ? 'today' : ''}`}
                      >
                        <span className="day-number">{cell.day}</span>
                        <span className="approved-count">{cell.approvedCount}</span>
                        <span className="approved-label">Approved</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            <section id="analytics" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Health analytics</h2>
                  <p className="section-subtitle">Clinic performance indicators</p>
                </div>
                <button className="link-pill" onClick={() => setShowInsightsPreview(true)}>
                  View Full Insights
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Daily Appointments</span>
                    <span className="trend-indicator good">Today</span>
                  </div>
                  <h3>{analyticsMetrics.dailyAppointments}</h3>
                  <p className="analytics-meta">Appointments scheduled today</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,24 20,22 40,20 60,18 80,20 100,16 120,14" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Last Week Appointments</span>
                    <span className="trend-indicator good">7 Days</span>
                  </div>
                  <h3>{analyticsMetrics.lastWeekAppointments}</h3>
                  <p className="analytics-meta">Total in last 7 days</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,30 20,28 40,24 60,20 80,18 100,16 120,14" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>One Month Appointments</span>
                    <span className="trend-indicator good">30 Days</span>
                  </div>
                  <h3>{analyticsMetrics.oneMonthAppointments}</h3>
                  <p className="analytics-meta">Total in last 30 days</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,32 20,30 40,27 60,24 80,20 100,16 120,12" />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Avg Ratings</span>
                    <span className="trend-indicator good">Reviews</span>
                  </div>
                  <h3>{analyticsMetrics.avgRating} / 5</h3>
                  <p className="analytics-meta">From {analyticsMetrics.totalRatings} submitted ratings</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points="0,28 20,24 40,20 60,18 80,16 100,14 120,12" />
                  </svg>
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

      {showInsightsPreview && (
        <div className="insights-overlay">
          <section className="insights-modal">
            <div className="insights-modal-head">
              <div>
                <h2>Full Insights</h2>
                <p>Detailed preview of appointments and ratings performance.</p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowInsightsPreview(false)}
              >
                Close
              </button>
            </div>

            <div className="analytics-grid insights-grid">
              <div className="analytics-card">
                <div className="analytics-header">
                  <span>Daily Appointments</span>
                </div>
                <h3>{analyticsMetrics.dailyAppointments}</h3>
                <p className="analytics-meta">Current day total</p>
              </div>

              <div className="analytics-card">
                <div className="analytics-header">
                  <span>Last Week Appointments</span>
                </div>
                <h3>{analyticsMetrics.lastWeekAppointments}</h3>
                <p className="analytics-meta">Rolling 7-day total</p>
              </div>

              <div className="analytics-card">
                <div className="analytics-header">
                  <span>One Month Appointments</span>
                </div>
                <h3>{analyticsMetrics.oneMonthAppointments}</h3>
                <p className="analytics-meta">Rolling 30-day total</p>
              </div>

              <div className="analytics-card">
                <div className="analytics-header">
                  <span>Average Ratings</span>
                </div>
                <h3>{analyticsMetrics.avgRating} / 5</h3>
                <p className="analytics-meta">Based on {analyticsMetrics.totalRatings} reviews</p>
              </div>
            </div>
          </section>
        </div>
      )}

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
