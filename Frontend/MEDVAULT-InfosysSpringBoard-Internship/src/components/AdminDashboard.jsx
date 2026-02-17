import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName] = useState('Admin Console');
  const [showStats, setShowStats] = useState(true);

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

  const handleLogout = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/admin-profile');
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
      title: 'Manage Doctors',
      icon: '⚕️',
      description: 'Add, verify, and manage doctor accounts',
      stats: '42 Active',
      color: '#3b82f6',
      link: '/admin-doctors'
    },
    {
      id: 1,
      title: 'Manage Patients',
      icon: '👥',
      description: 'Monitor patient accounts and access',
      stats: '1,240 Users',
      color: '#0066cc',
      link: '/admin-patients'
    },
    {
      id: 2,
      title: 'Medical Records',
      icon: '📋',
      description: 'Oversee records, permissions, and history',
      stats: '8,920 Files',
      color: '#00b8a9',
      link: '#medical-records'
    },
    {
      id: 3,
      title: 'Audit Logs',
      icon: '🧾',
      description: 'Track access, edits, and compliance events',
      stats: '24 Alerts',
      color: '#9b59b6',
      link: '#audit-logs'
    },
    {
      id: 4,
      title: 'Analytics',
      icon: '📊',
      description: 'Review hospital performance and trends',
      stats: '12 Reports',
      color: '#f39c12',
      link: '#analytics'
    },
    {
      id: 5,
      title: 'Settings',
      icon: '⚙️',
      description: 'Manage hospital-wide policies',
      stats: 'Security',
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
              <h2 className="sidebar-title">Admin Control</h2>
              <p className="sidebar-subtitle">Hospital operations dashboard</p>
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
              <p className="welcome-subtitle">Control access, compliance, and hospital insights</p>
            </div>

            <div className="cards-grid">
              {dashboardCards.map((card, index) => (
                <div
                  key={card.id}
                  className="dashboard-card"
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="card-header">
                    <div
                      className="card-icon"
                      style={{
                        background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`
                      }}
                    >
                      {card.icon}
                    </div>
                    <div className="card-badge">{card.stats}</div>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-description">{card.description}</p>
                  </div>

                  <div className="card-footer">
                    <button className="card-action" onClick={() => handleCardAction(card.link)}>
                      <span>Open</span>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className="card-glow" style={{ background: card.color }}></div>
                </div>
              ))}
            </div>
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
              <span className="stat-label">Doctor Approvals</span>
              <span className="stat-value">5 Pending</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🧑‍⚕️</div>
            <div className="stat-info">
              <span className="stat-label">Active Doctors</span>
              <span className="stat-value">42</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🔒</div>
            <div className="stat-info">
              <span className="stat-label">Security Alerts</span>
              <span className="stat-value">2</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default AdminDashboard;
