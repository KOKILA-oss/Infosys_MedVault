import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorPatientRegistry.css';

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
  const name = (patient.name || 'patient').trim().toLowerCase().split(' ').filter(Boolean).join('-');
  const phone = (patient.phoneNumber || '').split(' ').join('');
  return `${name}-${phone || 'na'}`;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const DoctorReports = () => {
  const navigate = useNavigate();
  const [allAppointments, setAllAppointments] = useState([]);
  const [registryData, setRegistryData] = useState({});
  const [reportNoteDrafts, setReportNoteDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientKey, setSelectedPatientKey] = useState('');

  useEffect(() => {
    setRegistryData(parseStoredRegistry());
  }, []);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        const resp = await axios.get('/api/doctor/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setAllAppointments(Array.isArray(resp.data) ? resp.data : []);
      } catch (error) {
        console.error('Failed to load appointments for reports', error);
        setAllAppointments([]);
      }
    };

    loadAppointments();
  }, []);

  const patientReportsData = useMemo(() => {
    const appointmentPatients = allAppointments
      .map((item) => {
        const name =
          item.patientName ||
          (item.patient?.name || item.patient?.fullName) ||
          'Patient';
        const email =
          item.patientEmail ||
          item.patient?.email ||
          '';
        const phoneNumber =
          item.patientPhone ||
          item.phoneNumber ||
          item.patient?.phoneNumber ||
          '';
        const key = createPatientKey({ name, email, phoneNumber });

        return {
          key,
          name,
          email,
          phoneNumber,
          hospital:
            item.hospital ||
            item.hospitalName ||
            item.doctor?.hospitalName ||
            'Hospital'
        };
      })
      .filter((item) => item.key);

    const map = new Map();

    appointmentPatients.forEach((patient) => {
      if (!map.has(patient.key)) {
        map.set(patient.key, patient);
      }
    });

    Object.entries(registryData).forEach(([key, value]) => {
      const profile = value?.profile || {};
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: profile.name || 'Patient',
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || '',
          hospital: 'Hospital'
        });
      }
    });

    return Array.from(map.values())
      .map((patient) => ({
        ...patient,
        reports: Array.isArray(registryData[patient.key]?.reports)
          ? registryData[patient.key].reports
          : []
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [allAppointments, registryData]);

  useEffect(() => {
    if (!patientReportsData.length) {
      setSelectedPatientKey('');
      return;
    }

    setSelectedPatientKey((current) => {
      if (current && patientReportsData.some((item) => item.key === current)) {
        return current;
      }
      return patientReportsData[0].key;
    });
  }, [patientReportsData]);

  const visiblePatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patientReportsData;

    return patientReportsData.filter((item) => {
      const haystack = `${item.name} ${item.email} ${item.phoneNumber}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [patientReportsData, searchTerm]);

  const selectedPatient = useMemo(() => {
    return patientReportsData.find((item) => item.key === selectedPatientKey) || null;
  }, [patientReportsData, selectedPatientKey]);

  const handleReportNoteChange = (patientKey, value) => {
    setReportNoteDrafts((current) => ({
      ...current,
      [patientKey]: value
    }));
  };

  const handlePatientReportUpload = (patient, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF reports.');
      return;
    }

    const patientKey = patient.key;
    const currentEntry = registryData[patientKey] || {};

    const reader = new FileReader();
    reader.onload = () => {
      const note = (reportNoteDrafts[patientKey] || '').trim();
      const report = {
        id: Date.now(),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        note,
        dataUrl: typeof reader.result === 'string' ? reader.result : ''
      };

      const nextRegistry = {
        ...registryData,
        [patientKey]: {
          ...currentEntry,
          profile: {
            ...currentEntry.profile,
            name: currentEntry.profile?.name || patient.name,
            email: currentEntry.profile?.email || patient.email,
            phoneNumber: currentEntry.profile?.phoneNumber || patient.phoneNumber
          },
          reports: [report, ...(Array.isArray(currentEntry.reports) ? currentEntry.reports : [])]
        }
      };

      setRegistryData(nextRegistry);
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(nextRegistry));
      setReportNoteDrafts((current) => ({
        ...current,
        [patientKey]: ''
      }));
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="doctor-registry-page">
      <header className="registry-header">
        <div>
          <h1>Reports</h1>
          <p>Manage patient reports with the same registry workflow.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="registry-layout">
        <aside className="registry-sidebar">
          <input
            className="registry-search"
            type="text"
            placeholder="Search patient"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="patient-list">
            {visiblePatients.length === 0 ? (
              <p className="muted">No patients found.</p>
            ) : (
              visiblePatients.map((patient) => (
                <button
                  key={patient.key}
                  type="button"
                  className={`patient-list-item ${selectedPatientKey === patient.key ? 'active' : ''}`}
                  onClick={() => setSelectedPatientKey(patient.key)}
                >
                  <strong>{patient.name}</strong>
                  <span>{patient.email || 'No email'}</span>
                  <span>{patient.phoneNumber || 'No phone'}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="registry-content">
          {selectedPatient ? (
            <section className="registry-card">
              <div className="section-header">
                <div>
                  <h2>{selectedPatient.name}</h2>
                  <p className="muted">
                    {selectedPatient.email || 'No email'}
                    {selectedPatient.phoneNumber ? ` • ${selectedPatient.phoneNumber}` : ''}
                  </p>
                </div>
                <span className="muted">{selectedPatient.reports.length} reports</span>
              </div>

              <div className="report-upload-row">
                <input
                  type="text"
                  placeholder="Optional note for this report"
                  value={reportNoteDrafts[selectedPatient.key] || ''}
                  onChange={(event) => handleReportNoteChange(selectedPatient.key, event.target.value)}
                />
                <label className="ghost-btn upload-inline-btn">
                  Upload PDF
                  {' '}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => handlePatientReportUpload(selectedPatient, event)}
                  />
                </label>
              </div>

              {(selectedPatient.reports || []).length === 0 ? (
                <p className="muted">No reports uploaded yet.</p>
              ) : (
                <div className="list-stack">
                  {selectedPatient.reports.map((item) => (
                    <div className="list-row" key={`${selectedPatient.key}-${item.id}`}>
                      <strong>{item.fileName || 'Report'}</strong>
                      {item.note ? <span>{item.note}</span> : null}
                      <small>Uploaded: {formatDateTime(item.uploadedAt)}</small>
                      {item.dataUrl ? (
                        <a className="ghost-btn" href={item.dataUrl} target="_blank" rel="noreferrer">
                          View PDF
                        </a>
                      ) : (
                        <span className="muted">Preview unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="registry-card">
              <h2>No patient selected</h2>
              <p className="muted">Select a patient from the left panel to view and upload reports.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorReports;
