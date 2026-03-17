import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';

const DOCTOR_LEAVE_DATES_KEY = 'doctorLeaveDates';
const REGISTRY_KEY = 'doctorPatientRegistry';

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

const buildSparklinePoints = (values) => {
  const safeValues = Array.isArray(values) && values.length ? values : [0];
  const maxValue = Math.max(...safeValues, 1);
  const step = safeValues.length > 1 ? 120 / (safeValues.length - 1) : 120;

  return safeValues
    .map((value, index) => {
      const x = Math.round(index * step);
      const y = Math.round(34 - ((Number(value) || 0) / maxValue) * 22);
      return `${x},${y}`;
    })
    .join(' ');
};

const parseAppointmentDateTime = (appointment) => {
  if (!appointment?.appointmentDate) return null;
  const dateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime || appointment.time || '00:00'}`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
};

const getPatientName = (appointment) =>
  appointment?.patientName ||
  appointment?.patient?.name ||
  appointment?.patient?.fullName ||
  'Patient';

const defaultDoctorSettings = {
  scheduleReminders: true,
  availabilityVisible: true,
  themePreference: 'light'
};

const getInitials = (name) => {
  if (!name) return 'P';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
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

const parseStoredRegistry = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const normalizeDoctorIdentifier = (value) => (value || '').trim().toLowerCase();

const canDoctorAccessReport = (report, doctor) => {
  const selectedName = normalizeDoctorIdentifier(report?.visibleToDoctorName);
  const selectedEmail = normalizeDoctorIdentifier(report?.visibleToDoctorEmail);
  const doctorName = normalizeDoctorIdentifier(doctor?.name);
  const doctorEmail = normalizeDoctorIdentifier(doctor?.email);

  if (!selectedName && !selectedEmail) return true;
  if (selectedEmail && doctorEmail && selectedEmail === doctorEmail) return true;
  if (selectedName && doctorName && selectedName === doctorName) return true;
  return false;
};

const isApprovedAppointment = (appointment) => (appointment?.status || '').toUpperCase() === 'APPROVED';
const isCompletedAppointment = (appointment) => (appointment?.status || '').toUpperCase() === 'COMPLETED';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('');
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const unreadNotificationCount = 0;
  const [approvedCountByDate, setApprovedCountByDate] = useState({});
  const [approvedAppointmentsByDate, setApprovedAppointmentsByDate] = useState({});
  const [leaveDates, setLeaveDates] = useState([]);
  const [showInsightsPreview, setShowInsightsPreview] = useState(false);
  const [doctorFeedbacks, setDoctorFeedbacks] = useState([]);
  const [doctorIdentity, setDoctorIdentity] = useState({ name: '', email: '' });
  const [registryData, setRegistryData] = useState({});
  const [doctorSettings, setDoctorSettings] = useState(defaultDoctorSettings);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [lastAnalysisRefresh, setLastAnalysisRefresh] = useState(null);

  useEffect(() => {
    setLeaveDates(parseStoredLeaveDates());
    const loadRegistry = () => setRegistryData(parseStoredRegistry());
    loadRegistry();
    globalThis.addEventListener('focus', loadRegistry);
    globalThis.addEventListener('storage', loadRegistry);
    return () => {
      globalThis.removeEventListener('focus', loadRegistry);
      globalThis.removeEventListener('storage', loadRegistry);
    };
  }, []);

  useEffect(() => {}, []);

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
        const data = Array.isArray(resp.data) ? resp.data : [];
        setAllAppointments(data);

        const approvedMap = data.reduce((acc, item) => {
          if (!isApprovedAppointment(item) || !item?.appointmentDate) return acc;

          const dateKey = item.appointmentDate;
          const appointment = {
            id: item.id,
            patientName: getPatientName(item),
            department: item.department || '',
            hospital: item.hospital || '',
            time: item.appointmentTime || item.time || '',
            appointmentDate: item.appointmentDate
          };

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }

          acc[dateKey].push(appointment);
          return acc;
        }, {});

        Object.values(approvedMap).forEach((appointments) => {
          appointments.sort((first, second) => (first.time || '').localeCompare(second.time || ''));
        });

        setApprovedAppointmentsByDate(approvedMap);
        setApprovedCountByDate(
          Object.fromEntries(Object.entries(approvedMap).map(([dateKey, appointments]) => [dateKey, appointments.length]))
        );

        const now = new Date();
        const upcoming = data
          .filter((item) => isApprovedAppointment(item))
          .map((item) => {
            const dateTime = parseAppointmentDateTime(item);

            return {
              id: item.id,
              patientName: getPatientName(item),
              department: item.department || '',
              hospital: item.hospital || '',
              time: item.appointmentTime || item.time || '',
              appointmentDate: item.appointmentDate,
              dateTime,
              status: item.status
            };
          })
          .filter((item) => item.dateTime && item.dateTime >= now)
          .sort((a, b) => a.dateTime - b.dateTime);

        setTodayAppointments(upcoming);
        setLastAnalysisRefresh(new Date());
      } catch (err) {
        console.error('Failed to load appointments', err);
        setTodayAppointments([]);
        setAllAppointments([]);
        setApprovedAppointmentsByDate({});
        setApprovedCountByDate({});
      }
    };

    loadAppointments();
    const interval = setInterval(loadAppointments, 15000);
    window.addEventListener('focus', loadAppointments);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', loadAppointments);
    };
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
        const name = doctor?.user?.name;
        const email = doctor?.user?.email || doctor?.email || '';

        setUserName(name || 'Doctor');
        setDoctorIdentity({ name: name || '', email });
      } catch (error) {
        console.error('Failed to fetch doctor profile', error);
      }
    };

    fetchDoctorProfile();
  }, []);

  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setDoctorFeedbacks([]);
          return;
        }

        const response = await axios.get('/api/feedback/doctor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDoctorFeedbacks(Array.isArray(response.data) ? response.data : []);
        setLastAnalysisRefresh(new Date());
      } catch (error) {
        console.error('Failed to load doctor feedbacks', error);
        setDoctorFeedbacks([]);
      }
    };

    loadFeedbacks();
    const interval = setInterval(loadFeedbacks, 15000);
    window.addEventListener('focus', loadFeedbacks);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', loadFeedbacks);
    };
  }, []);

  useEffect(() => {
    const loadDoctorSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/doctor/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const nextSettings = { ...defaultDoctorSettings, ...(response.data || {}) };
        setDoctorSettings(nextSettings);

        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme && nextSettings.themePreference) {
          document.documentElement.dataset.theme = nextSettings.themePreference;
          setTheme(nextSettings.themePreference);
        }
      } catch (error) {
        console.error('Failed to load doctor settings', error);
      }
    };

    loadDoctorSettings();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.dataset.theme = newTheme;
    setDoctorSettings((prev) => ({ ...prev, themePreference: newTheme }));
    setSettingsStatus('Theme updated. Save settings to keep this preference.');
  };

  const handleLogout = () => navigate('/');
  const handleProfileClick = () => navigate('/doctor-profile');
  const handleNavClick = (event, link) => {
    if (link?.startsWith('/')) {
      event.preventDefault();
      navigate(link);
    }
  };
  const handleCardAction = (link) => {
    if (link?.startsWith('/')) navigate(link);
  };
  const handleSettingsChange = (field) => {
    setDoctorSettings((prev) => ({ ...prev, [field]: !prev[field] }));
    setSettingsStatus('');
  };

  const saveDoctorSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSettingsStatus('Please log in again to save settings.');
        return;
      }

      const response = await axios.put('/api/doctor/settings', doctorSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const savedSettings = { ...defaultDoctorSettings, ...(response.data || {}) };
      setDoctorSettings(savedSettings);
      setSettingsStatus('Settings saved.');

      if (savedSettings.themePreference) {
        setTheme(savedSettings.themePreference);
        localStorage.setItem('theme', savedSettings.themePreference);
        document.documentElement.dataset.theme = savedSettings.themePreference;
      }
    } catch (error) {
      console.error('Failed to save doctor settings', error);
      setSettingsStatus('Unable to save settings.');
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
        approvedAppointments: approvedAppointmentsByDate[dateKey] || [],
        isToday: dateKey === formatDateKey(new Date())
      });
    }

    return {
      monthLabel: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      cells
    };
  }, [leaveDates, approvedAppointmentsByDate, approvedCountByDate]);

  const dashboardCards = [
    { id: 0, title: 'Overview', icon: 'Overview', color: '#3b82f6', link: '#summary' },
    { id: 1, title: 'Patients', icon: 'Patients', color: '#0066cc', link: '/doctor-patient-registry' },
    { id: 2, title: 'Appointments', icon: 'Calendar', color: '#00b8a9', link: '/doctor-bookings' },
    { id: 3, title: 'Schedule', icon: 'Schedule', color: '#9b59b6', link: '/doctor-schedule' },
    { id: 4, title: 'Analytics', icon: 'Analytics', color: '#f39c12', link: '#analytics' },
    { id: 5, title: 'Prescriptions', icon: 'Rx', color: '#34495e', link: '/doctor-prescriptions' }
  ];

  const analyticsMetrics = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateKey(now);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const dailySeries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() - (6 - index));
      const dateKey = formatDateKey(date);
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateKey,
        count: allAppointments.filter((item) => {
          const appointmentDate = parseAppointmentDateTime(item);
          return appointmentDate && formatDateKey(appointmentDate) === dateKey && isApprovedAppointment(item);
        }).length
      };
    });

    const upcomingWeekSeries = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() + index);
      const dateKey = formatDateKey(date);
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateKey,
        count: allAppointments.filter((item) => {
          const appointmentDate = parseAppointmentDateTime(item);
          return appointmentDate && formatDateKey(appointmentDate) === dateKey && isApprovedAppointment(item);
        }).length
      };
    });

    const monthlySeries = Array.from({ length: 4 }, (_, index) => {
      const periodEnd = new Date(startOfToday);
      periodEnd.setDate(startOfToday.getDate() - (3 - index) * 7);
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodEnd.getDate() - 6);

      const count = allAppointments.filter((item) => {
        const appointmentDate = parseAppointmentDateTime(item);
        return appointmentDate && appointmentDate >= periodStart && appointmentDate <= periodEnd && isCompletedAppointment(item);
      }).length;

      return {
        label: `${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        count
      };
    });

    const dailyAppointments = dailySeries[dailySeries.length - 1]?.count || 0;
    const lastWeekAppointments = dailySeries.reduce((sum, item) => sum + item.count, 0);
    const oneMonthAppointments = monthlySeries.reduce((sum, item) => sum + item.count, 0);
    const upcomingWeekAppointments = upcomingWeekSeries.reduce((sum, item) => sum + item.count, 0);

    const ratings = doctorFeedbacks
      .map((item) => Number(item?.rating || 0))
      .filter((value) => value > 0);

    const latestRatings = [...doctorFeedbacks]
      .sort((first, second) => new Date(first?.createdAt || 0) - new Date(second?.createdAt || 0))
      .slice(-7)
      .map((item) => Number(item?.rating || 0))
      .filter((value) => value > 0);

    const avgRating = ratings.length
      ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)
      : '0.0';

    return {
      dailyAppointments,
      lastWeekAppointments,
      oneMonthAppointments,
      upcomingWeekAppointments,
      avgRating,
      totalRatings: ratings.length,
      dailySeries,
      upcomingWeekSeries,
      monthlySeries,
      latestRatings
    };
  }, [allAppointments, doctorFeedbacks]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon-small">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="logo-title">MedVault</span>
          </div>

          <div className="header-actions">
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>

            <div className="user-menu">
              <button type="button" className="user-avatar" onClick={handleProfileClick} title="Profile">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              {/* Notifications removed for doctors */}
              <button onClick={handleLogout} className="logout-btn" title="Logout">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              <h1 className="welcome-title">Welcome back, {userName}!</h1>
              <p className="welcome-subtitle">Your patients, appointments, and clinical insights</p>
            </div>

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
                                <p className="appointment-date">{appointment.appointmentDate}</p>
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
                        title={
                          cell.approvedAppointments.length
                            ? cell.approvedAppointments
                                .map((appointment) => `${formatTimeLabel(appointment.time)} - ${appointment.patientName}`)
                                .join('\n')
                            : 'No approved appointments'
                        }
                      >
                        <span className="day-number">{cell.day}</span>
                        <span className="approved-count">{cell.approvedCount}</span>
                        <span className="approved-label">Approved</span>
                        {cell.approvedAppointments.length ? (
                          <span className="calendar-hover-card" aria-hidden="true">
                            <strong>Approved bookings</strong>
                            {cell.approvedAppointments.map((appointment) => (
                              <span key={appointment.id || `${appointment.patientName}-${appointment.time}`}>
                                {formatTimeLabel(appointment.time)} - {appointment.patientName}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            <section id="analytics" className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Live Analysis</h2>
                  <p className="section-subtitle">Real-time appointment and rating trends from current backend data</p>
                </div>
                <button className="link-pill" onClick={() => setShowInsightsPreview(true)}>
                  View Full Insights
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Today&apos;s Approved Bookings</span>
                    <span className="trend-indicator good">Live</span>
                  </div>
                  <h3>{analyticsMetrics.dailyAppointments}</h3>
                  <p className="analytics-meta">Compared across the last 7 days of approved appointments</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={buildSparklinePoints(analyticsMetrics.dailySeries.map((item) => item.count))} />
                  </svg>
                  <div className="analytics-footnote">
                    {analyticsMetrics.dailySeries.map((item) => (
                      <span key={item.dateKey}>{item.label}: {item.count}</span>
                    ))}
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Next 7 Days</span>
                    <span className="trend-indicator good">Forecast</span>
                  </div>
                  <h3>{analyticsMetrics.upcomingWeekAppointments}</h3>
                  <p className="analytics-meta">Approved upcoming appointments scheduled over the next week</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={buildSparklinePoints(analyticsMetrics.upcomingWeekSeries.map((item) => item.count))} />
                  </svg>
                  <div className="analytics-footnote">
                    {analyticsMetrics.upcomingWeekSeries.map((item) => (
                      <span key={item.dateKey}>{item.label}: {item.count}</span>
                    ))}
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Completed This Month</span>
                    <span className="trend-indicator good">30 Days</span>
                  </div>
                  <h3>{analyticsMetrics.oneMonthAppointments}</h3>
                  <p className="analytics-meta">Completed appointments grouped by the last four weekly windows</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={buildSparklinePoints(analyticsMetrics.monthlySeries.map((item) => item.count))} />
                  </svg>
                  <div className="analytics-footnote">
                    {analyticsMetrics.monthlySeries.map((item) => (
                      <span key={item.label}>{item.label}: {item.count}</span>
                    ))}
                  </div>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Patient Rating</span>
                    <span className="trend-indicator good">Reviews</span>
                  </div>
                  <h3>{analyticsMetrics.avgRating} / 5</h3>
                  <p className="analytics-meta">Live average from {analyticsMetrics.totalRatings} submitted ratings</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={buildSparklinePoints(analyticsMetrics.latestRatings)} />
                  </svg>
                  <div className="analytics-footnote">
                    {(analyticsMetrics.latestRatings.length ? analyticsMetrics.latestRatings : [0]).map((rating, index) => (
                      <span key={`${rating}-${index}`}>Review {index + 1}: {rating}</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="summary-meta">Last synced: {lastAnalysisRefresh ? lastAnalysisRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Waiting for data'}</p>
            </section>

            {/* Settings section removed */}
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
                  <span>Today&apos;s Approved Bookings</span>
                </div>
                <h3>{analyticsMetrics.dailyAppointments}</h3>
                <p className="analytics-meta">Current day total</p>
              </div>

              <div className="analytics-card">
                <div className="analytics-header">
                  <span>Next 7 Days</span>
                </div>
                <h3>{analyticsMetrics.upcomingWeekAppointments}</h3>
                <p className="analytics-meta">Upcoming approved total</p>
              </div>

              <div className="analytics-card">
                <div className="analytics-header">
                  <span>Completed This Month</span>
                </div>
                <h3>{analyticsMetrics.oneMonthAppointments}</h3>
                <p className="analytics-meta">Rolling 30-day completed total</p>
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
    </div>
  );
};

export default DoctorDashboard;
