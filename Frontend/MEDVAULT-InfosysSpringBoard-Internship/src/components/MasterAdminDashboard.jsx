import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import './MasterAdminDashboard.css';

const ADMIN_STORAGE_KEY = 'masterAdminAdmins';
const HOSPITAL_STORAGE_KEY = 'masterAdminHospitals';

const MasterAdminDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [admins, setAdmins] = useState(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  });
  const [hospitals, setHospitals] = useState(() => {
    const stored = localStorage.getItem(HOSPITAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  });
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    hospital: '',
    role: 'Hospital Admin'
  });
  const [hospitalForm, setHospitalForm] = useState({
    hospitalName: '',
    adminEmail: '',
    region: '',
    licenseId: ''
  });

  const masterLabel = useMemo(() => {
    const stored = localStorage.getItem('masterAdminEmail');
    return stored ? stored : 'Master Admin';
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  useEffect(() => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(hospitals));
  }, [hospitals]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('masterAdminEmail');
    navigate('/');
  };

  const handleAdminChange = (event) => {
    setAdminForm({
      ...adminForm,
      [event.target.name]: event.target.value
    });
  };

  const handleHospitalChange = (event) => {
    setHospitalForm({
      ...hospitalForm,
      [event.target.name]: event.target.value
    });
  };

  const handleAddAdmin = (event) => {
    event.preventDefault();
    const name = adminForm.name.trim();
    const email = adminForm.email.trim();
    const hospital = adminForm.hospital.trim();
    if (!name || !email || !hospital) {
      return;
    }
    const newAdmin = {
      id: Date.now(),
      name,
      email,
      hospital,
      role: adminForm.role,
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    setAdmins((prev) => [newAdmin, ...prev]);
    setAdminForm({ name: '', email: '', hospital: '', role: 'Hospital Admin' });
  };

  const handleDeleteAdmin = (id) => {
    setAdmins((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAuthorizeHospital = (event) => {
    event.preventDefault();
    const hospitalName = hospitalForm.hospitalName.trim();
    const adminEmail = hospitalForm.adminEmail.trim();
    if (!hospitalName || !adminEmail) {
      return;
    }
    const newHospital = {
      id: Date.now(),
      hospitalName,
      adminEmail,
      region: hospitalForm.region.trim(),
      licenseId: hospitalForm.licenseId.trim(),
      status: 'Authorized',
      createdAt: new Date().toISOString()
    };
    setHospitals((prev) => [newHospital, ...prev]);
    setHospitalForm({ hospitalName: '', adminEmail: '', region: '', licenseId: '' });
  };

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'admins', label: 'Admins' },
    { id: 'hospitals', label: 'Hospitals' },
    { id: 'access', label: 'Access Logs' }
  ];

  const cards = [
    { id: 'card-admin', title: 'Create Admin', description: 'Issue admin access for new hospitals.', stats: 'New Access' },
    { id: 'card-hospital', title: 'Authorize Hospital', description: 'Activate hospital accounts and profiles.', stats: 'Onboarding' },
    { id: 'card-directory', title: 'Admin Directory', description: 'Review active admins and permissions.', stats: `${admins.length} Active` },
    { id: 'card-audit', title: 'Compliance Logs', description: 'Track edits, approvals, and changes.', stats: 'Audit Ready' }
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
              <button type="button" className="user-avatar" title="Master Admin">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
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
              <h2 className="sidebar-title">Master Admin</h2>
              <p className="sidebar-subtitle">Global access control</p>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <a key={item.id} className="sidebar-item" href={`#${item.id}`}>
                  <span className="sidebar-icon">{item.label.slice(0, 2)}</span>
                  <span className="sidebar-label">{item.label}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="dashboard-content">
            <div className="dashboard-welcome" id="overview">
              <h1 className="welcome-title">Welcome, {masterLabel}</h1>
              <p className="welcome-subtitle">Create admins, authorize hospitals, and review access.</p>
            </div>

            <div className="cards-grid">
              {cards.map((card, index) => (
                <div key={card.id} className="dashboard-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="card-header">
                    <div className="card-icon">MA</div>
                    <div className="card-badge">{card.stats}</div>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-description">{card.description}</p>
                  </div>
                  <div className="card-footer">
                    <button className="card-action" type="button">
                      <span>Open</span>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="card-glow"></div>
                </div>
              ))}
            </div>

            <section className="master-section" id="admins">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Create Admin Profile</h2>
                  <p className="section-subtitle">Issue access for hospital-level admins.</p>
                </div>
              </div>
              <form className="master-form" onSubmit={handleAddAdmin}>
                <div className="master-field">
                  <label htmlFor="name">Full Name</label>
                  <input
                    className="master-input"
                    type="text"
                    id="name"
                    name="name"
                    value={adminForm.name}
                    onChange={handleAdminChange}
                    placeholder="Admin full name"
                    required
                  />
                </div>
                <div className="master-field">
                  <label htmlFor="email">Email</label>
                  <input
                    className="master-input"
                    type="email"
                    id="email"
                    name="email"
                    value={adminForm.email}
                    onChange={handleAdminChange}
                    placeholder="admin@hospital.org"
                    required
                  />
                </div>
                <div className="master-field">
                  <label htmlFor="hospital">Hospital</label>
                  <input
                    className="master-input"
                    type="text"
                    id="hospital"
                    name="hospital"
                    value={adminForm.hospital}
                    onChange={handleAdminChange}
                    placeholder="Hospital name"
                    required
                  />
                </div>
                <div className="master-field">
                  <label htmlFor="role">Role</label>
                  <select
                    className="master-input"
                    id="role"
                    name="role"
                    value={adminForm.role}
                    onChange={handleAdminChange}
                  >
                    <option>Hospital Admin</option>
                    <option>Compliance Admin</option>
                    <option>Operations Admin</option>
                  </select>
                </div>
                <div className="master-actions">
                  <button className="master-btn" type="submit">Create Admin</button>
                </div>
              </form>

              <div className="master-list">
                {admins.length === 0 ? (
                  <p className="master-empty">No admins created yet.</p>
                ) : (
                  admins.map((admin) => (
                    <div key={admin.id} className="master-item">
                      <div>
                        <h3>{admin.name}</h3>
                        <p>{admin.email} · {admin.hospital}</p>
                      </div>
                      <div className="master-item-actions">
                        <span className="master-pill">{admin.role}</span>
                        <button className="master-btn danger" type="button" onClick={() => handleDeleteAdmin(admin.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="master-section" id="hospitals">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Authorize Hospital Account</h2>
                  <p className="section-subtitle">Create hospital access and link admins.</p>
                </div>
              </div>
              <form className="master-form" onSubmit={handleAuthorizeHospital}>
                <div className="master-field">
                  <label htmlFor="hospitalName">Hospital Name</label>
                  <input
                    className="master-input"
                    type="text"
                    id="hospitalName"
                    name="hospitalName"
                    value={hospitalForm.hospitalName}
                    onChange={handleHospitalChange}
                    placeholder="Hospital name"
                    required
                  />
                </div>
                <div className="master-field">
                  <label htmlFor="adminEmail">Admin Email</label>
                  <input
                    className="master-input"
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    value={hospitalForm.adminEmail}
                    onChange={handleHospitalChange}
                    placeholder="admin@hospital.org"
                    required
                  />
                </div>
                <div className="master-field">
                  <label htmlFor="region">Region</label>
                  <input
                    className="master-input"
                    type="text"
                    id="region"
                    name="region"
                    value={hospitalForm.region}
                    onChange={handleHospitalChange}
                    placeholder="State or region"
                  />
                </div>
                <div className="master-field">
                  <label htmlFor="licenseId">License ID</label>
                  <input
                    className="master-input"
                    type="text"
                    id="licenseId"
                    name="licenseId"
                    value={hospitalForm.licenseId}
                    onChange={handleHospitalChange}
                    placeholder="License or registration"
                  />
                </div>
                <div className="master-actions">
                  <button className="master-btn" type="submit">Authorize</button>
                </div>
              </form>

              <div className="master-list">
                {hospitals.length === 0 ? (
                  <p className="master-empty">No hospital accounts created yet.</p>
                ) : (
                  hospitals.map((hospital) => (
                    <div key={hospital.id} className="master-item">
                      <div>
                        <h3>{hospital.hospitalName}</h3>
                        <p>{hospital.adminEmail} · {hospital.region || 'Region pending'}</p>
                      </div>
                      <div className="master-item-actions">
                        <span className="master-pill">{hospital.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="master-section" id="access">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Access Summary</h2>
                  <p className="section-subtitle">Last updated and audit readiness.</p>
                </div>
              </div>
              <div className="master-summary">
                <div>
                  <h3>{admins.length}</h3>
                  <p>Admins issued</p>
                </div>
                <div>
                  <h3>{hospitals.length}</h3>
                  <p>Hospitals authorized</p>
                </div>
                <div>
                  <h3>0</h3>
                  <p>Security flags</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MasterAdminDashboard;
