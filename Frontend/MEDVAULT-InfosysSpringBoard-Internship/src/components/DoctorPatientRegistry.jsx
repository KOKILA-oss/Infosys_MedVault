import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorPatientRegistry.css';

const REGISTRY_KEY = 'doctorPatientRegistry';

const defaultProfile = {
  name: '',
  email: '',
  phoneNumber: '',
  gender: '',
  bloodGroup: '',
  address: '',
  height: '',
  weight: '',
  sugarLevel: '',
  allergies: '',
  emergencyContact: ''
};

const defaultReview = {
  diagnosis: '',
  symptoms: '',
  vitals: '',
  followUpDate: '',
  doctorNotes: ''
};

const emptyPrescription = {
  medication: '',
  dosage: '',
  duration: '',
  instructions: ''
};

const mergeTruthyFields = (base, updates) => {
  const next = { ...base };
  Object.entries(updates).forEach(([key, value]) => {
    if (value) next[key] = value;
  });
  return next;
};

const formatFieldLabel = (field) => {
  const withSpaces = field
    .split('')
    .map((char, index) => (index > 0 && char >= 'A' && char <= 'Z' ? ` ${char}` : char))
    .join('');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

const createPatientKey = (patient) => {
  const email = (patient.email || '').trim().toLowerCase();
  if (email) return email;
  const name = (patient.name || 'patient').trim().toLowerCase().split(' ').filter(Boolean).join('-');
  const phone = (patient.phoneNumber || '').split(' ').join('');
  return `${name}-${phone || 'na'}`;
};

const parseStoredRegistry = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const DoctorPatientRegistry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState({});
  const [patientOrder, setPatientOrder] = useState([]);
  const [selectedPatientKey, setSelectedPatientKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadError, setLoadError] = useState('');
  const [profileDraft, setProfileDraft] = useState(defaultProfile);
  const [reviewDraft, setReviewDraft] = useState(defaultReview);
  const [prescriptionDraft, setPrescriptionDraft] = useState(emptyPrescription);
  const [reportNote, setReportNote] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setLoadError('');
      const token = localStorage.getItem('token');
      const storedRegistry = parseStoredRegistry();

      if (!token) {
        setRegistry({});
        setPatientOrder([]);
        setSelectedPatientKey('');
        setLoadError('Login expired. Please sign in again.');
        setLoading(false);
        return;
      }

      let patients = [];
      try {
        const response = await axios.get('/api/doctor/appointments/patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        patients = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Unable to fetch doctor patient registry', error);
        setRegistry({});
        setPatientOrder([]);
        setSelectedPatientKey('');
        setLoadError('Unable to load connected patients right now.');
        setLoading(false);
        return;
      }

      const mergedRegistry = {};

      patients.forEach((item) => {
        const profile = {
          name: item.name || 'Patient',
          email: item.email || '',
          phoneNumber: item.phoneNumber || '',
          gender: item.gender || '',
          bloodGroup: item.bloodGroup || '',
          address: item.address || '',
          height: item.height ?? '',
          weight: item.weight ?? '',
          sugarLevel: item.sugarLevel ?? '',
          allergies: item.allergies || '',
          emergencyContact: item.emergencyContact || ''
        };

        const key = createPatientKey(profile);
        const existing = storedRegistry[key] || {};

        mergedRegistry[key] = {
          profile: {
            ...defaultProfile,
            ...profile,
            ...mergeTruthyFields({}, existing.profile || {})
          },
          review: {
            ...defaultReview,
            ...existing.review
          },
          prescriptions: Array.isArray(existing.prescriptions) ? existing.prescriptions : [],
          reports: Array.isArray(existing.reports) ? existing.reports : [],
          meta: {
            patientId: item.patientId,
            appointmentCount: item.appointmentCount || 0,
            latestAppointmentDate: item.latestAppointmentDate || '',
            latestAppointmentStatus: item.latestAppointmentStatus || ''
          }
        };
      });

      const keys = Object.keys(mergedRegistry).sort((a, b) => {
        const nameA = (mergedRegistry[a]?.profile?.name || '').toLowerCase();
        const nameB = (mergedRegistry[b]?.profile?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setRegistry(mergedRegistry);
      setPatientOrder(keys);

      if (keys.length > 0) {
        setSelectedPatientKey((current) =>
          current && keys.includes(current) ? current : keys[0]
        );
      } else {
        setSelectedPatientKey('');
      }

      setLoading(false);
    };

    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientKey || !registry[selectedPatientKey]) return;
    setProfileDraft({
      ...defaultProfile,
      ...registry[selectedPatientKey].profile
    });
    setReviewDraft({
      ...defaultReview,
      ...registry[selectedPatientKey].review
    });
  }, [selectedPatientKey, registry]);

  const visiblePatientKeys = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patientOrder;

    return patientOrder.filter((key) => {
      const patient = registry[key]?.profile || {};
      return (
        (patient.name || '').toLowerCase().includes(query) ||
        (patient.email || '').toLowerCase().includes(query) ||
        (patient.phoneNumber || '').toLowerCase().includes(query)
      );
    });
  }, [patientOrder, registry, searchTerm]);

  const selectedPatient = selectedPatientKey ? registry[selectedPatientKey] : null;

  const persistRegistry = (nextRegistry) => {
    setRegistry(nextRegistry);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(nextRegistry));
  };

  const saveProfileAndReview = () => {
    if (!selectedPatientKey || !registry[selectedPatientKey]) return;

    const nextRegistry = {
      ...registry,
      [selectedPatientKey]: {
        ...registry[selectedPatientKey],
        profile: {
          ...defaultProfile,
          ...profileDraft
        },
        review: {
          ...defaultReview,
          ...reviewDraft
        }
      }
    };

    persistRegistry(nextRegistry);
  };

  const addPrescription = () => {
    if (!selectedPatientKey || !selectedPatient) return;
    if (!prescriptionDraft.medication.trim()) return;

    const entry = {
      id: Date.now(),
      dateIssued: new Date().toISOString(),
      medication: prescriptionDraft.medication.trim(),
      dosage: prescriptionDraft.dosage.trim(),
      duration: prescriptionDraft.duration.trim(),
      instructions: prescriptionDraft.instructions.trim()
    };

    const nextRegistry = {
      ...registry,
      [selectedPatientKey]: {
        ...selectedPatient,
        prescriptions: [entry, ...(selectedPatient.prescriptions || [])]
      }
    };

    persistRegistry(nextRegistry);
    setPrescriptionDraft(emptyPrescription);
  };

  const handlePdfUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !selectedPatientKey || !selectedPatient) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF reports.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const report = {
        id: Date.now(),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        note: reportNote.trim(),
        dataUrl: typeof reader.result === 'string' ? reader.result : ''
      };

      const nextRegistry = {
        ...registry,
        [selectedPatientKey]: {
          ...selectedPatient,
          reports: [report, ...(selectedPatient.reports || [])]
        }
      };

      persistRegistry(nextRegistry);
      setReportNote('');
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="doctor-registry-page">
      <header className="registry-header">
        <div>
          <h1>Patient Registry</h1>
          <p>Review patient profiles, prescriptions, reports, and doctor notes in one place.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="registry-layout">
        <aside className="registry-sidebar">
          <input
            type="text"
            className="registry-search"
            placeholder="Search patient by name/email/phone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="patient-list">
            {visiblePatientKeys.length === 0 ? (
              <p className="muted">No patients found.</p>
            ) : (
              visiblePatientKeys.map((key) => {
                const patient = registry[key]?.profile || {};
                return (
                  <button
                    key={key}
                    type="button"
                    className={`patient-list-item ${selectedPatientKey === key ? 'active' : ''}`}
                    onClick={() => setSelectedPatientKey(key)}
                  >
                    <strong>{patient.name || 'Patient'}</strong>
                    <span>{patient.email || 'No email'}</span>
                    <span>{patient.phoneNumber || 'No phone'}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="registry-content">
          {loading ? (
            <div className="registry-card">Loading patient registry...</div>
          ) : loadError ? (
            <div className="registry-card">{loadError}</div>
          ) : (
            selectedPatient ? (
              <>
              <div className="registry-card">
                <div className="section-header">
                  <div>
                    <h2>Patient Profile</h2>
                    <p className="muted">
                      Connected through {selectedPatient.meta?.appointmentCount || 0} appointment(s)
                      {selectedPatient.meta?.latestAppointmentDate
                        ? ` • Latest: ${selectedPatient.meta.latestAppointmentDate} (${selectedPatient.meta.latestAppointmentStatus || 'N/A'})`
                        : ''}
                    </p>
                  </div>
                  <button className="primary-btn" onClick={saveProfileAndReview}>
                    Save Updates
                  </button>
                </div>

                <div className="profile-grid">
                  {Object.entries(profileDraft).map(([field, value]) => (
                    <label key={field}>
                      <span>{formatFieldLabel(field)}</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(event) =>
                          setProfileDraft((prev) => ({ ...prev, [field]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="registry-card">
                <h2>Clinical Review</h2>
                <div className="review-grid">
                  <label>
                    <span>Diagnosis</span>
                    <input
                      type="text"
                      value={reviewDraft.diagnosis}
                      onChange={(event) =>
                        setReviewDraft((prev) => ({ ...prev, diagnosis: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    <span>Symptoms</span>
                    <input
                      type="text"
                      value={reviewDraft.symptoms}
                      onChange={(event) =>
                        setReviewDraft((prev) => ({ ...prev, symptoms: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    <span>Vitals</span>
                    <input
                      type="text"
                      value={reviewDraft.vitals}
                      onChange={(event) =>
                        setReviewDraft((prev) => ({ ...prev, vitals: event.target.value }))
                      }
                    />
                  </label>

                  <label>
                    <span>Follow-up Date</span>
                    <input
                      type="date"
                      value={reviewDraft.followUpDate}
                      onChange={(event) =>
                        setReviewDraft((prev) => ({ ...prev, followUpDate: event.target.value }))
                      }
                    />
                  </label>

                  <label className="full-width">
                    <span>Doctor Notes</span>
                    <textarea
                      rows="4"
                      value={reviewDraft.doctorNotes}
                      onChange={(event) =>
                        setReviewDraft((prev) => ({ ...prev, doctorNotes: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="registry-card">
                <h2>Prescriptions</h2>
                <div className="prescription-form">
                  <input
                    type="text"
                    placeholder="Medicine"
                    value={prescriptionDraft.medication}
                    onChange={(event) =>
                      setPrescriptionDraft((prev) => ({ ...prev, medication: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={prescriptionDraft.dosage}
                    onChange={(event) =>
                      setPrescriptionDraft((prev) => ({ ...prev, dosage: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={prescriptionDraft.duration}
                    onChange={(event) =>
                      setPrescriptionDraft((prev) => ({ ...prev, duration: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={prescriptionDraft.instructions}
                    onChange={(event) =>
                      setPrescriptionDraft((prev) => ({ ...prev, instructions: event.target.value }))
                    }
                  />
                  <button className="primary-btn" onClick={addPrescription}>
                    Add Prescription
                  </button>
                </div>

                <div className="list-stack">
                  {(selectedPatient.prescriptions || []).length === 0 ? (
                    <p className="muted">No prescriptions added yet.</p>
                  ) : (
                    selectedPatient.prescriptions.map((item) => (
                      <div className="list-row" key={item.id}>
                        <strong>{item.medication}</strong>
                        <span>{item.dosage || 'No dosage'} • {item.duration || 'No duration'}</span>
                        <span>{item.instructions || 'No instructions'}</span>
                        <small>Added: {formatDateTime(item.dateIssued)}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="registry-card">
                <h2>Reports (PDF)</h2>
                <div className="report-upload-row">
                  <input
                    type="text"
                    placeholder="Optional note for this report"
                    value={reportNote}
                    onChange={(event) => setReportNote(event.target.value)}
                  />
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} />
                </div>

                <div className="list-stack">
                  {(selectedPatient.reports || []).length === 0 ? (
                    <p className="muted">No reports uploaded yet.</p>
                  ) : (
                    selectedPatient.reports.map((item) => (
                      <div className="list-row" key={item.id}>
                        <strong>{item.fileName}</strong>
                        <span>{item.note || 'No note added'}</span>
                        <small>Uploaded: {formatDateTime(item.uploadedAt)}</small>
                        {item.dataUrl ? (
                          <a className="link-btn" href={item.dataUrl} target="_blank" rel="noreferrer">
                            Open PDF
                          </a>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
              </>
            ) : (
              <div className="registry-card">No patient available for this doctor yet.</div>
            )
          )}
        </section>
      </div>
    </div>
  );
};

export default DoctorPatientRegistry;
