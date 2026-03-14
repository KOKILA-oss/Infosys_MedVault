import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientSettingsPage.css';

const defaultSettings = {
  appointmentNotifications: true,
  reportNotifications: true,
  reminderNotifications: true,
  dataSharingEnabled: false,
  chatbotEnabled: true,
  themePreference: 'light'
};

const PatientSettingsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/patient/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const nextSettings = { ...defaultSettings, ...(response.data || {}) };
        setSettings(nextSettings);
        document.documentElement.dataset.theme = nextSettings.themePreference || 'light';
        localStorage.setItem('theme', nextSettings.themePreference || 'light');
      } catch (error) {
        console.error('Failed to load patient settings', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [token]);

  const toggleSetting = (field) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
    setStatus('');
  };

  const toggleTheme = () => {
    setSettings((prev) => {
      const nextTheme = prev.themePreference === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('theme', nextTheme);
      return { ...prev, themePreference: nextTheme };
    });
    setStatus('');
  };

  const saveSettings = async () => {
    try {
      if (!token) return;
      const response = await axios.put('/api/patient/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const saved = { ...defaultSettings, ...(response.data || {}) };
      setSettings(saved);
      document.documentElement.dataset.theme = saved.themePreference || 'light';
      localStorage.setItem('theme', saved.themePreference || 'light');
      setStatus('Settings saved.');
    } catch (error) {
      console.error('Failed to save settings', error);
      setStatus('Unable to save settings.');
    }
  };

  return (
    <div className="patient-settings-page">
      <header className="patient-settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage notifications, privacy, chatbot access, and theme preferences.</p>
        </div>
        <div className="patient-settings-actions">
          <button className="ghost-btn" onClick={() => navigate('/patient-dashboard')}>
            Back to Dashboard
          </button>
          <button className="primary-btn" onClick={saveSettings} disabled={loading}>
            Save Settings
          </button>
        </div>
      </header>

      <main className="patient-settings-content">
        {loading ? <p>Loading settings...</p> : null}

        <section className="settings-panel">
          <div className="settings-row">
            <div>
              <h3>Appointment notifications</h3>
              <p>Receive updates when appointments are created or changed.</p>
            </div>
            <button className="primary-btn" onClick={() => toggleSetting('appointmentNotifications')}>
              {settings.appointmentNotifications ? 'On' : 'Off'}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Report notifications</h3>
              <p>Get alerts when new reports are available.</p>
            </div>
            <button className="primary-btn" onClick={() => toggleSetting('reportNotifications')}>
              {settings.reportNotifications ? 'On' : 'Off'}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Reminder notifications</h3>
              <p>Keep reminders enabled for appointments and follow-ups.</p>
            </div>
            <button className="primary-btn" onClick={() => toggleSetting('reminderNotifications')}>
              {settings.reminderNotifications ? 'On' : 'Off'}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Data sharing</h3>
              <p>Allow doctors to use your profile details for smoother care coordination.</p>
            </div>
            <button className="primary-btn" onClick={() => toggleSetting('dataSharingEnabled')}>
              {settings.dataSharingEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Chatbot access</h3>
              <p>Show or hide the MedVault assistant across the patient area.</p>
            </div>
            <button className="primary-btn" onClick={() => toggleSetting('chatbotEnabled')}>
              {settings.chatbotEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <h3>Theme preference</h3>
              <p>Current theme: {settings.themePreference}</p>
            </div>
            <button className="primary-btn" onClick={toggleTheme}>
              Switch to {settings.themePreference === 'dark' ? 'light' : 'dark'}
            </button>
          </div>
        </section>

        {status ? <p className="settings-status">{status}</p> : null}
      </main>
    </div>
  );
};

export default PatientSettingsPage;
