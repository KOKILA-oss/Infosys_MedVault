import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientRegistryFile.css';

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

const normalizeDate = (entry) => {
  const raw =
    entry?.dateIssued ||
    entry?.measuredAt ||
    entry?.uploadedAt ||
    entry?.addedAt ||
    entry?.createdAt ||
    null;

  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveAppointmentDateTime = (appointment) => {
  const parsed = new Date(`${appointment?.appointmentDate}T${appointment?.appointmentTime || '00:00'}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const createDummyAppointments = () => {
  const now = new Date();
  const pastOne = new Date(now);
  pastOne.setDate(now.getDate() - 3);
  const pastTwo = new Date(now);
  pastTwo.setDate(now.getDate() - 12);

  const asDate = (date) => date.toISOString().slice(0, 10);

  return [
    {
      id: `registry-demo-1-${now.getTime()}`,
      doctorName: 'Dr. Meera Iyer',
      department: 'General Medicine',
      hospital: 'City Care Hospital',
      appointmentDate: asDate(pastOne),
      appointmentTime: '11:00',
      status: 'COMPLETED',
      reason: 'Routine checkup'
    },
    {
      id: `registry-demo-2-${now.getTime()}`,
      doctorName: 'Dr. Arjun Nair',
      department: 'Cardiology',
      hospital: 'Apollo Health Centre',
      appointmentDate: asDate(pastTwo),
      appointmentTime: '16:30',
      status: 'COMPLETED',
      reason: 'BP monitoring follow-up'
    }
  ];
};

const withFallbackItems = (items, fallback) => {
  if (Array.isArray(items) && items.length > 0) return items;
  return fallback;
};

const PatientRegistryFile = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('Patient');
  const [patientIdentity, setPatientIdentity] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [appointments, setAppointments] = useState([]);
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
    const loadAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAppointments(createDummyAppointments());
          return;
        }

        const response = await axios.get('/api/patient/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const list = Array.isArray(response.data) ? response.data : [];
        setAppointments(list.length > 0 ? list : createDummyAppointments());
      } catch (error) {
        console.error('Failed to load appointments', error);
        setAppointments(createDummyAppointments());
      }
    };

    loadAppointments();
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

  useEffect(() => {
    if (!patientKey) return;

    const registry = parseStoredRegistry();
    const existing = registry[patientKey] || {};
    const now = Date.now();

    const seededPrescriptions = [
      {
        id: now + 1,
        dateIssued: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
        medication: 'Amlodipine 5mg',
        dosage: '1 tablet',
        duration: '30 days',
        instructions: 'Take after breakfast'
      }
    ];

    const seededCheckups = [
      {
        id: now + 2,
        measuredAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
        bp: '130/86',
        heartRate: '84',
        sugarLevel: '138',
        weight: '73.2'
      },
      {
        id: now + 3,
        measuredAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        bp: '124/82',
        heartRate: '79',
        sugarLevel: '126',
        weight: '72.4'
      }
    ];

    const seededReports = [
      {
        id: now + 4,
        fileName: 'Dummy_ECG_Report.pdf',
        uploadedAt: new Date(now - 11 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Sample registry report',
        dataUrl: '',
        uploadedBy: 'doctor'
      }
    ];

    const seededTips = [
      {
        id: now + 5,
        addedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        text: 'Avoid salty foods and track BP daily in the evening.'
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
          'Vitals are improving. Continue medications and schedule next review in 2 weeks.'
      },
      prescriptions: withFallbackItems(existing.prescriptions, seededPrescriptions),
      checkups: withFallbackItems(existing.checkups, seededCheckups),
      reports: withFallbackItems(existing.reports, seededReports),
      tips: withFallbackItems(existing.tips, seededTips)
    };

    const nextRegistry = {
      ...registry,
      [patientKey]: nextEntry
    };

    localStorage.setItem(REGISTRY_KEY, JSON.stringify(nextRegistry));
    setRegistryData(nextRegistry);
  }, [effectivePatientIdentity, patientKey]);

  const patientRegistry = useMemo(() => {
    const item = registryData[patientKey];
    return item && typeof item === 'object' ? item : {};
  }, [registryData, patientKey]);

  const pastAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .map((item) => {
        const dateTime = resolveAppointmentDateTime(item);
        return { ...item, dateTime };
      })
      .filter((item) => item.dateTime && item.dateTime < now)
      .sort((a, b) => b.dateTime - a.dateTime);
  }, [appointments]);

  const buildRegistryForAppointment = (appointmentDateTime) => {
    const filterByDate = (list) => {
      if (!Array.isArray(list)) return [];
      return list.filter((entry) => {
        const entryDate = normalizeDate(entry);
        if (!entryDate) return true;
        return entryDate <= appointmentDateTime;
      });
    };

    return {
      doctorNotes: patientRegistry?.review?.doctorNotes || '',
      prescriptions: filterByDate(patientRegistry?.prescriptions || []),
      checkups: filterByDate(patientRegistry?.checkups || []),
      reports: filterByDate(patientRegistry?.reports || []),
      tips: filterByDate(patientRegistry?.tips || [])
    };
  };

  return (
    <div className="patient-registry-file-page">
      <header className="patient-registry-header">
        <div>
          <h1>Registery File</h1>
          <p>Past appointments and doctor-entered registry details for each visit.</p>
        </div>
        <div className="patient-registry-header-actions">
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="ghost-btn" onClick={() => navigate('/patient-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="patient-registry-main">
        <section className="patient-registry-summary-card">
          <h2>{userName}</h2>
          <p>{pastAppointments.length} past appointments found</p>
        </section>

        <section className="patient-registry-list">
          {pastAppointments.length === 0 ? (
            <article className="patient-registry-item">
              <p>No past appointments available yet.</p>
            </article>
          ) : (
            pastAppointments.map((appointment) => {
              const details = buildRegistryForAppointment(appointment.dateTime);

              return (
                <article key={appointment.id || `${appointment.appointmentDate}-${appointment.appointmentTime}`} className="patient-registry-item">
                  <div className="patient-registry-item-head">
                    <div>
                      <h3>{appointment.doctorName || 'Doctor'}</h3>
                      <p>{appointment.department || 'General'} • {appointment.hospital || 'Hospital'}</p>
                    </div>
                    <div className="patient-registry-date">
                      <strong>{formatDateTime(appointment.dateTime)}</strong>
                      <span>{appointment.status || 'Completed'}</span>
                    </div>
                  </div>

                  <div className="patient-registry-item-meta">
                    <span>Reason: {appointment.reason || 'N/A'}</span>
                    <button
                      className="patient-registry-report-btn"
                      onClick={() => navigate('/patient-profile?tab=reports')}
                    >
                      Show Reports
                    </button>
                  </div>

                  <div className="patient-registry-details-grid">
                    <div className="patient-registry-detail-card">
                      <h4>Doctor Notes</h4>
                      <p>{details.doctorNotes || 'No notes added.'}</p>
                    </div>

                    <div className="patient-registry-detail-card">
                      <h4>Prescriptions</h4>
                      {details.prescriptions.length === 0 ? (
                        <p>No prescriptions recorded for this timeline.</p>
                      ) : (
                        <ul>
                          {details.prescriptions.map((item) => (
                            <li key={item.id || `${item.medication}-${item.dateIssued}`}>
                              <strong>{item.medication || 'Medication'}</strong>
                              <span>{item.dosage || 'Dosage N/A'} • {item.duration || 'Duration N/A'}</span>
                              <small>{item.instructions || 'No instructions'}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="patient-registry-detail-card">
                      <h4>Checkups</h4>
                      {details.checkups.length === 0 ? (
                        <p>No checkups recorded for this timeline.</p>
                      ) : (
                        <ul>
                          {details.checkups.map((item) => (
                            <li key={item.id || `${item.measuredAt}-${item.bp}`}>
                              <strong>{formatDateTime(item.measuredAt)}</strong>
                              <span>BP: {item.bp || 'N/A'} • HR: {item.heartRate || 'N/A'} • Sugar: {item.sugarLevel || 'N/A'} • Weight: {item.weight || 'N/A'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="patient-registry-detail-card">
                      <h4>Reports</h4>
                      {details.reports.length === 0 ? (
                        <p>No reports uploaded for this timeline.</p>
                      ) : (
                        <ul>
                          {details.reports.map((item) => (
                            <li key={item.id || `${item.fileName}-${item.uploadedAt}`}>
                              {item.dataUrl ? (
                                <a href={item.dataUrl} target="_blank" rel="noopener noreferrer">{item.fileName || 'Report PDF'}</a>
                              ) : (
                                <strong>{item.fileName || 'Report PDF'}</strong>
                              )}
                              <small>{formatDateTime(item.uploadedAt)}</small>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="patient-registry-detail-card full-width">
                      <h4>Doctor Tips</h4>
                      {details.tips.length === 0 ? (
                        <p>No tips added for this timeline.</p>
                      ) : (
                        <ul>
                          {details.tips.map((item) => (
                            <li key={item.id || `${item.addedAt}-${item.text}`}>
                              <strong>{formatDateTime(item.addedAt)}</strong>
                              <span>{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};

export default PatientRegistryFile;
