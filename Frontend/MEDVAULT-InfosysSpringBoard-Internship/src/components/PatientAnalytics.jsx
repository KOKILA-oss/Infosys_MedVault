import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientDashboard.css';

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

const PatientAnalytics = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('Patient');
  const [patientIdentity, setPatientIdentity] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [registryData, setRegistryData] = useState({});

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
        setUserName(mergedPatient.name || 'Patient');
      } catch (error) {
        console.error('Failed to fetch patient profile', error);
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

  const allCheckups = useMemo(() => {
    const list = registryData[patientKey]?.checkups;
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => new Date(b?.measuredAt || 0) - new Date(a?.measuredAt || 0));
  }, [registryData, patientKey]);

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

  const graphDatewiseRows = checkupsForGraph.map((item) => ({
    dateLabel: formatDateTime(item.measuredAt),
    heartRate: Number.isFinite(item.heartRate) ? `${item.heartRate} bpm` : 'N/A',
    sugarLevel: Number.isFinite(item.sugarLevel) ? `${item.sugarLevel} mg/dL` : 'N/A',
    weight: Number.isFinite(item.weight) ? `${item.weight} kg` : 'N/A'
  }));

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
            <button className="link-pill" onClick={() => navigate('/patient-dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <h1 className="welcome-title">Health Analytics, {userName}</h1>
            <p className="welcome-subtitle">All doctor-entered checkup insights in one place</p>
          </div>

          <section id="analytics" className="dashboard-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Health analytics</h2>
                <p className="section-subtitle">Doctor-entered checkup details from all appointments</p>
              </div>
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

            <div className="analytics-graph-card">
              <div className="analytics-header">
                <span>Vitals trend graph (recent checkups)</span>
                <span className="analytics-meta">Last {checkupsForGraph.length || 0} entries</span>
              </div>
              <svg className="analytics-multi-graph" viewBox="0 0 120 40" aria-label="Vitals trend graph">
                {heartLinePoints ? <polyline className="graph-line heart" points={heartLinePoints} /> : null}
                {sugarLinePoints ? <polyline className="graph-line sugar" points={sugarLinePoints} /> : null}
                {weightLinePoints ? <polyline className="graph-line weight" points={weightLinePoints} /> : null}
              </svg>
              <div className="analytics-legend">
                <span><i className="legend-dot heart" /> Heart Rate</span>
                <span><i className="legend-dot sugar" /> Sugar Level</span>
                <span><i className="legend-dot weight" /> Weight</span>
              </div>
              {graphDatewiseRows.length === 0 ? (
                <p className="analytics-meta">No date-wise values available for graph yet.</p>
              ) : (
                <div className="datewise-values-grid">
                  {graphDatewiseRows.map((row) => (
                    <div key={`${row.dateLabel}-${row.heartRate}-${row.sugarLevel}-${row.weight}`} className="datewise-value-item">
                      <p className="datewise-date">{row.dateLabel}</p>
                      <p className="datewise-metrics">HR: {row.heartRate} • Sugar: {row.sugarLevel} • Weight: {row.weight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="checkup-details-card">
              <h3>Basic checkup details from doctor</h3>
              {allCheckups.length === 0 ? (
                <p className="analytics-meta">No checkup details recorded yet for your appointments.</p>
              ) : (
                <div className="checkup-table-wrap">
                  <table className="checkup-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Blood Pressure</th>
                        <th>Heart Rate</th>
                        <th>Sugar Level</th>
                        <th>Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCheckups.map((entry) => (
                        <tr key={entry.id || `${entry.measuredAt}-${entry.bp}-${entry.heartRate}`}>
                          <td>{formatDateTime(entry.measuredAt)}</td>
                          <td>{entry.bp || 'N/A'}</td>
                          <td>{entry.heartRate ? `${entry.heartRate} bpm` : 'N/A'}</td>
                          <td>{entry.sugarLevel ? `${entry.sugarLevel} mg/dL` : 'N/A'}</td>
                          <td>{entry.weight ? `${entry.weight} kg` : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PatientAnalytics;
