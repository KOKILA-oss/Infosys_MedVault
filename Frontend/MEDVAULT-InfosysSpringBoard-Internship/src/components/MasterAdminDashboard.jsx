import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterAdminDashboard.css';

const STORAGE_KEY = 'medvault_hospital_admins';

const MasterAdminDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    hospitalName: '',
    adminName: '',
    adminEmail: '',
    password: ''
  });

  useEffect(() => {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (role !== 'master_admin') {
      navigate('/master-login', { replace: true });
      return;
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;

    const savedAdmins = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setAdmins(savedAdmins);
  }, [navigate]);

  const totalHospitals = useMemo(
    () => new Set(admins.map((item) => item.hospitalName.trim().toLowerCase())).size,
    [admins]
  );

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  const persistAdmins = (nextAdmins) => {
    setAdmins(nextAdmins);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAdmins));
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleCreateAdmin = (event) => {
    event.preventDefault();

    const newAdmin = {
      id: Date.now(),
      hospitalName: formData.hospitalName.trim(),
      adminName: formData.adminName.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      password: formData.password,
      createdAt: new Date().toISOString()
    };

    if (!newAdmin.hospitalName || !newAdmin.adminName || !newAdmin.adminEmail || !newAdmin.password) {
      return;
    }

    const nextAdmins = [newAdmin, ...admins];
    persistAdmins(nextAdmins);
    setFormData({ hospitalName: '', adminName: '', adminEmail: '', password: '' });
  };

  const handleDeleteAdmin = (id) => {
    const nextAdmins = admins.filter((item) => item.id !== id);
    persistAdmins(nextAdmins);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('master_admin_email');
    navigate('/');
  };

  return (
    <div className="master-dashboard-container">
      <header className="master-dashboard-header">
        <div className="master-brand">
          <div className="master-brand-icon">⚕</div>
          <span>MedVault Master Console</span>
        </div>

        <div className="master-header-actions">
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
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            Logout
          </button>
        </div>
      </header>

      <main className="master-dashboard-main">
        <section className="master-welcome">
          <h1>Master Admin Dashboard</h1>
          <p>Create hospital admins, authorize account ownership, and manage admin access centrally.</p>
        </section>

        <section className="master-stats-grid">
          <article className="master-stat-card">
            <h3>{admins.length}</h3>
            <p>Total Hospital Admins</p>
          </article>
          <article className="master-stat-card">
            <h3>{totalHospitals}</h3>
            <p>Hospitals Managed</p>
          </article>
          <article className="master-stat-card">
            <h3>2</h3>
            <p>Master Admin Accounts</p>
          </article>
        </section>

        <section className="master-grid">
          <article className="master-card">
            <h2>Create Hospital Admin</h2>
            <form className="master-form" onSubmit={handleCreateAdmin}>
              <div className="master-form-grid">
                <div className="form-group">
                  <label htmlFor="hospitalName">Hospital Name</label>
                  <input
                    id="hospitalName"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    placeholder="Enter hospital name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adminName">Admin Name</label>
                  <input
                    id="adminName"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="Enter admin full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adminEmail">Admin Email</label>
                  <input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    placeholder="admin@hospital.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Temporary Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Set temporary password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="master-primary-btn">Create Admin Authority</button>
            </form>
          </article>

          <article className="master-card">
            <h2>Manage Existing Admins</h2>
            {admins.length === 0 ? (
              <p className="empty-text">No hospital admins created yet.</p>
            ) : (
              <div className="master-admin-list">
                {admins.map((item) => (
                  <div key={item.id} className="master-admin-item">
                    <div>
                      <h3>{item.adminName}</h3>
                      <p>{item.adminEmail}</p>
                      <span>{item.hospitalName}</span>
                    </div>
                    <button type="button" className="delete-btn" onClick={() => handleDeleteAdmin(item.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
};

export default MasterAdminDashboard;
