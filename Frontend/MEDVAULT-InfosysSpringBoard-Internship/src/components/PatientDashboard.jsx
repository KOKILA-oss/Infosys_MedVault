import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PatientDashboard.css';
import axios from 'axios';

const REGISTRY_KEY = 'doctorPatientRegistry';

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
  const name = (patient.username || patient.name || 'patient')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .join('-');
  const phone = (patient.phoneNumber || '').split(' ').join('');
  return `${name}-${phone || 'na'}`;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const extractNumeric = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const numberRegex = /-?\d+(?:\.\d+)?/;
  const match = numberRegex.exec(String(value));
  return match ? Number(match[0]) : null;
};

const buildSparklinePoints = (values, width = 120, height = 40) => {
  if (!Array.isArray(values) || values.length === 0) return '';
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return '';
  if (clean.length === 1) {
    const y = height / 2;
    return `0,${y} ${width},${y}`;
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const spread = max - min || 1;
  const stepX = width / (clean.length - 1);

  return clean
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / spread) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};

const computeAverage = (values) => {
  if (!values.length) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const createDummyAppointments = () => {
  const now = new Date();
  const upcomingDate = new Date(now);
  upcomingDate.setDate(now.getDate() + 2);

  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - 6);

  const isoDate = (date) => date.toISOString().slice(0, 10);

  return [
    {
      id: `demo-upcoming-${now.getTime()}`,
      doctorName: 'Dr. Priya Sharma',
      department: 'General Medicine',
      hospital: 'City Care Hospital',
      appointmentDate: isoDate(upcomingDate),
      appointmentTime: '10:30',
      status: 'APPROVED',
      reason: 'Follow-up consultation'
    },
    {
      id: `demo-past-${now.getTime()}`,
      doctorName: 'Dr. Ravi Menon',
      department: 'Cardiology',
      hospital: 'Apollo Health Centre',
      appointmentDate: isoDate(pastDate),
      appointmentTime: '15:00',
      status: 'COMPLETED',
      reason: 'Routine checkup'
    }
  ];
};

const withFallbackItems = (items, fallback) => {
  if (Array.isArray(items) && items.length > 0) return items;
  return fallback;
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

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [patientIdentity, setPatientIdentity] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [registryData, setRegistryData] = useState({});

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    if (storedName && storedName.trim()) {
      setUserName(storedName.trim());
      return;
    }
    if (storedEmail && storedEmail.includes('@')) {
      setUserName(storedEmail.split('@')[0]);
      return;
    }
    setUserName('Patient');
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const resp = await axios.get('/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUnreadNotificationCount(Number(resp.data || 0));
      } catch (error) {
        console.error('Failed to fetch unread count', error);
      }
    };

    const onNotificationsUpdated = () => fetchUnreadCount();
    window.addEventListener('notifications:updated', onNotificationsUpdated);
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => {
      window.removeEventListener('notifications:updated', onNotificationsUpdated);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const token = localStorage.getItem('token');
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

        setUserName(
          mergedPatient.name || 'Patient'
        );
      } catch (error) {
        console.error('Failed to fetch patient profile', error);
        setUserName('Patient');
      }
    };

    fetchPatientProfile();
  }, []);

  useEffect(() => {
    const loadRegistry = () => {
      setRegistryData(parseStoredRegistry());
    };

    loadRegistry();
    globalThis.addEventListener('focus', loadRegistry);
    globalThis.addEventListener('storage', loadRegistry);

    return () => {
      globalThis.removeEventListener('focus', loadRegistry);
      globalThis.removeEventListener('storage', loadRegistry);
    };
  }, []);

  useEffect(() => {
  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const resp = await axios.get('/api/patient/appointments', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const list = Array.isArray(resp.data) ? resp.data : [];
      setAppointments(list.length > 0 ? list : createDummyAppointments());

    } catch (error) {
      console.error('Failed to load appointments', error);
      setAppointments(createDummyAppointments());
    }
  };

  loadAppointments();
}, []);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const resp = await axios.get('/api/patient/records', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = Array.isArray(resp.data) ? resp.data : [];
        const sorted = data
          .slice()
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setReports(sorted);
      } catch (error) {
        console.error('Failed to load reports', error);
        setReports([]);
      }
    };

    loadReports();
  }, []);


  useEffect(() => {
    // Check for saved theme preference
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

  const handleLogout = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/patient-profile');
  };

  const handleNavClick = (event, link) => {
    if (link?.startsWith('/')) {
      if (isReportsLink(link)) {
        return;
      }
      event.preventDefault();
      navigate(link);
    }
  };

  const handleCardAction = (link) => {
    if (link?.startsWith('/')) {
      if (isReportsLink(link)) {
        openInNewTab(link);
        return;
      }
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

  const formatReportDate = (dateValue) => {
    if (!dateValue) return 'Uploaded recently';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Uploaded recently';
    return `Uploaded ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })}`;
  };

  const onDownloadReport = async (recordId, fileName) => {
    try {
      const token = localStorage.getItem('token');
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



 const upcomingAppointments = appointments
  .filter((item) => item.status !== 'CANCELLED')
  .map((item) => {
    const dateTime = new Date(
      `${item.appointmentDate}T${item.appointmentTime || "00:00"}`
    );

    return { ...item, dateTime };
  })
  .filter((item) => !Number.isNaN(item.dateTime.getTime()))
  .filter((item) => item.dateTime >= new Date())
  .sort((a, b) => a.dateTime - b.dateTime)
  .slice(0, 3);

  const nextAppointment = appointments
    .filter((item) => item.status !== 'CANCELLED')
    .map((item) => ({
      ...item,
      dateTime: new Date(`${item.appointmentDate}T${item.appointmentTime}`)
    }))
    .filter((item) => item.dateTime >= new Date())
    .sort((a, b) => a.dateTime - b.dateTime)[0];

  const pendingNotificationCount = appointments.filter((item) => {
    const normalizedStatus = (item.status || '').toUpperCase();
    return ['PENDING', 'RESCHEDULED', 'CANCELED', 'CANCELLED'].includes(normalizedStatus);
  }).length + (nextAppointment ? 1 : 0);

  const effectiveUnreadNotificationCount =
    unreadNotificationCount || Number(localStorage.getItem('unreadNotificationCount') || 0) || pendingNotificationCount;

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

  useEffect(() => {
    if (!patientKey) return;

    const registry = parseStoredRegistry();
    const existing = registry[patientKey] || {};

    const now = Date.now();
    const seededCheckups = [
      {
        id: now + 1,
        measuredAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        bp: '122/80',
        heartRate: '82',
        sugarLevel: '128',
        weight: '72.1'
      },
      {
        id: now + 2,
        measuredAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        bp: '118/76',
        heartRate: '78',
        sugarLevel: '121',
        weight: '71.8'
      },
      {
        id: now + 3,
        measuredAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        bp: '120/78',
        heartRate: '80',
        sugarLevel: '124',
        weight: '71.6'
      }
    ];

    const seededPrescriptions = [
      {
        id: now + 4,
        dateIssued: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
        medication: 'Metformin 500mg',
        dosage: '1 tablet',
        duration: '30 days',
        instructions: 'After dinner'
      }
    ];

    const seededReports = [
      {
        id: now + 5,
        fileName: 'Dummy_Blood_Report.pdf',
        uploadedAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Sample report for dashboard testing',
        dataUrl: '',
        uploadedBy: 'doctor'
      }
    ];

    const seededTips = [
      {
        id: now + 6,
        addedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        text: 'Walk 30 minutes daily and reduce sugar intake.'
      }
    ];

    const nextEntry = {
      ...existing,
      profile: {
        ...existing.profile,
        name: existing.profile?.name || effectivePatientIdentity.name,
        email: existing.profile?.email || effectivePatientIdentity.email,
        phoneNumber: existing.profile?.phoneNumber || effectivePatientIdentity.phoneNumber
      },
      review: {
        ...existing.review,
        doctorNotes:
          existing.review?.doctorNotes ||
          'Continue current medication and monitor vitals weekly.'
      },
      prescriptions: withFallbackItems(existing.prescriptions, seededPrescriptions),
      reports: withFallbackItems(existing.reports, seededReports),
      checkups: withFallbackItems(existing.checkups, seededCheckups),
      tips: withFallbackItems(existing.tips, seededTips)
    };

    const nextRegistry = {
      ...registry,
      [patientKey]: nextEntry
    };

    localStorage.setItem(REGISTRY_KEY, JSON.stringify(nextRegistry));
    setRegistryData(nextRegistry);
  }, [effectivePatientIdentity, patientKey]);

  const allCheckups = useMemo(() => {
    const list = registryData[patientKey]?.checkups;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => new Date(b?.measuredAt || 0) - new Date(a?.measuredAt || 0));
  }, [registryData, patientKey]);

  const patientReports = useMemo(() => {
    const list = registryData[patientKey]?.reports;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => new Date(b?.uploadedAt || 0) - new Date(a?.uploadedAt || 0));
  }, [registryData, patientKey]);

  const latestReport = patientReports[0] || reports[0] || null;

  const checkupsForGraph = useMemo(() => {
    return [...allCheckups]
      .reverse()
      .slice(-10)
      .map((entry) => ({
        measuredAt: entry?.measuredAt,
        heartRate: extractNumeric(entry?.heartRate),
        sugarLevel: extractNumeric(entry?.sugarLevel),
        weight: extractNumeric(entry?.weight)
      }));
  }, [allCheckups]);

  const latestCheckup = allCheckups[0] || null;
  const bpReadings = allCheckups.map((item) => item?.bp).filter((value) => String(value || '').trim());
  const heartRateSeries = checkupsForGraph.map((item) => item.heartRate).filter((value) => Number.isFinite(value));
  const sugarSeries = checkupsForGraph.map((item) => item.sugarLevel).filter((value) => Number.isFinite(value));
  const weightSeries = checkupsForGraph.map((item) => item.weight).filter((value) => Number.isFinite(value));

  const avgHeartRate = computeAverage(heartRateSeries);
  const avgSugar = computeAverage(sugarSeries);
  const latestWeight = weightSeries.length ? weightSeries.at(-1) : null;

  const heartLinePoints = buildSparklinePoints(heartRateSeries);
  const sugarLinePoints = buildSparklinePoints(sugarSeries);
  const weightLinePoints = buildSparklinePoints(weightSeries);

  const analyticsPageLink = '/patient-analytics';

  const handleViewReport = (report) => {
    if (report?.dataUrl) {
      globalThis.open(report.dataUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate('/patient-profile?tab=reports');
  };

  const handleDownloadReport = (report) => {
    if (!report?.dataUrl) {
      navigate('/patient-profile?tab=reports');
      return;
    }

    const anchor = globalThis.document.createElement('a');
    anchor.href = report.dataUrl;
    anchor.download = report.fileName || 'report.pdf';
    anchor.style.display = 'none';
    globalThis.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };


  const dashboardCards = [
    {
      id: 0,
      title: 'Registery file',
      icon: '✨',
      color: '#3b82f6',
      link: '/patient-registry-file'
    },
    {
      id: 1,
      title: 'Appointments',
      icon: '📅',
      color: '#0066cc',
      link: '/patient-bookings?tab=all'
    },
    {
      id: 2,
      title: 'Health Analytics',
      icon: '📈',
      color: '#00b8a9',
      link: analyticsPageLink
    },
    {
      id: 3,
      title: 'Reports',
      icon: '📄',
      color: '#9b59b6',
      link: '/patient-profile?tab=reports'
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
                {effectiveUnreadNotificationCount > 0 && (
                  <span className="notification-badge" aria-label={`${effectiveUnreadNotificationCount} unread notifications`}>
                    {effectiveUnreadNotificationCount > 9 ? '9+' : effectiveUnreadNotificationCount}
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
                <a
                  key={card.id}
                  className="sidebar-item"
                  href={card.link}
                  target={isReportsLink(card.link) ? '_blank' : undefined}
                  rel={isReportsLink(card.link) ? 'noopener noreferrer' : undefined}
                  onClick={(event) => handleNavClick(event, card.link)}
                >
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
                    <h3 className="summary-value">{latestReport?.fileName || 'No reports yet'}</h3>
                    <span className="summary-meta">
                      {latestReport ? latestReport.uploadedAt ? `Uploaded ${formatDateTime(latestReport.uploadedAt)}` : formatReportDate(latestReport.createdAt) : 'Upload report to view'}
                    </span>
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
                          <span className="appointment-flag">
  Upcoming
</span>
                        </div>
                        <div className="appointment-details">
                          <h3>{appointment.doctorName || 'Doctor'}</h3>
                          <p>{appointment.department} • {appointment.hospital}</p>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <span className={`status-badge ${
  appointment.status === 'APPROVED'
    ? 'confirmed'
    : appointment.status === 'PENDING'
    ? 'pending'
    : 'cancelled'
}`}>
  {appointment.status}
</span>
 
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
                  <p className="section-subtitle">Doctor-entered checkup details from all appointments</p>
                </div>
                <button className="link-pill" onClick={() => handleCardAction(analyticsPageLink)}>
                  View Full Insights
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Blood Pressure</span>
                    <span className="trend-indicator good">🟢 Latest</span>
                  </div>
                  <h3>{latestCheckup?.bp || 'N/A'}</h3>
                  <p className="analytics-meta">{bpReadings.length} checkup entries</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={heartLinePoints || '0,20 120,20'} />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Sugar Level</span>
                    <span className="trend-indicator warn">🟡 Average</span>
                  </div>
                  <h3>{avgSugar ? `${avgSugar.toFixed(1)} mg/dL` : 'N/A'}</h3>
                  <p className="analytics-meta">Based on recent checkups</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={sugarLinePoints || '0,20 120,20'} />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Weight Progress</span>
                    <span className="trend-indicator good">🟢 Latest</span>
                  </div>
                  <h3>{latestWeight ? `${latestWeight.toFixed(1)} kg` : 'N/A'}</h3>
                  <p className="analytics-meta">From doctor checkup notes</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={weightLinePoints || '0,20 120,20'} />
                  </svg>
                </div>
                <div className="analytics-card">
                  <div className="analytics-header">
                    <span>Heart Rate</span>
                    <span className="trend-indicator alert">🔴 Average</span>
                  </div>
                  <h3>{avgHeartRate ? `${avgHeartRate.toFixed(0)} bpm` : 'N/A'}</h3>
                  <p className="analytics-meta">Based on recent checkups</p>
                  <svg className="sparkline" viewBox="0 0 120 40" aria-hidden="true">
                    <polyline points={heartLinePoints || '0,20 120,20'} />
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
                <button className="link-pill" onClick={() => handleCardAction('/patient-profile?tab=reports')}>
                  Upload Report
                </button>
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
                      <button className="primary-btn" onClick={() => navigate('/patient-profile?tab=reports')}>
                        Go to Reports
                      </button>
                    </div>
                  </div>
                ) : (
                  (patientReports.length > 0 ? patientReports.slice(0, 3) : reports.slice(0, 3)).map((item) => (
                    <div className="report-item" key={item.id || `${item.fileName}-${item.uploadedAt || item.createdAt}`}>
                      <div>
                        <h3>{item.fileName || item.title || 'Report'}</h3>
                        <p>
                          {(item.note || item.uploadedBy || 'Report')} • Uploaded {formatDateTime(item.uploadedAt)}
                        </p>
                      </div>
                      <div className="report-actions">
                        <span className={`report-status ${item.uploadedAt && !item.dataUrl ? 'muted' : ''}`}>
                          {item.uploadedAt ? (item.dataUrl ? 'Ready' : 'Unavailable') : 'Ready'}
                        </span>
                        <button className="ghost-btn" onClick={() => (item.uploadedAt ? handleViewReport(item) : handleCardAction('/patient-medical-records'))}>{item.uploadedAt ? 'View PDF' : 'View'}</button>
                        <button className="primary-btn" onClick={() => (item.uploadedAt ? handleDownloadReport(item) : onDownloadReport(item.id, item.fileName))}>Download</button>
                      </div>
                    </div>
                  ))
                )}
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


    </div>
  );

};

export default PatientDashboard;



