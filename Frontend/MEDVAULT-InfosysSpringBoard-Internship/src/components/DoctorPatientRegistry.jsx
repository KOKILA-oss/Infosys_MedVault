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

const demoPatients = [
  {
    profile: {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@demo.com',
      phoneNumber: '+91 98765 43210',
      gender: 'Male',
      bloodGroup: 'B+',
      address: 'Baner, Pune',
      height: '174',
      weight: '72',
      sugarLevel: '104',
      allergies: 'Dust',
      emergencyContact: 'Anita Sharma - +91 99887 66554'
    },
    review: {
      diagnosis: 'Mild seasonal allergy',
      symptoms: 'Sneezing, watery eyes',
      vitals: 'BP 120/80, Pulse 74',
      followUpDate: '',
      doctorNotes: 'Advise hydration and anti-allergic medication.'
    },
    prescriptions: [
      {
        id: 101,
        dateIssued: new Date().toISOString(),
        medication: 'Cetirizine',
        dosage: '10 mg',
        duration: '5 days',
        instructions: 'Take after dinner'
      }
    ],
    reports: []
  },
  {
    profile: {
      name: 'Meera Nair',
      email: 'meera.nair@demo.com',
      phoneNumber: '+91 97654 32109',
      gender: 'Female',
      bloodGroup: 'O+',
      address: 'Kormangala, Bengaluru',
      height: '162',
      weight: '58',
      sugarLevel: '92',
      allergies: 'None',
      emergencyContact: 'Vikram Nair - +91 90011 22334'
    },
    review: {
      diagnosis: 'Routine follow-up',
      symptoms: 'No active complaint',
      vitals: 'BP 114/76, Pulse 70',
      followUpDate: '',
      doctorNotes: 'Continue current lifestyle plan and annual screening.'
    },
    prescriptions: [],
    reports: []
  },
  {
    profile: {
      name: 'Aman Verma',
      email: 'aman.verma@demo.com',
      phoneNumber: '+91 98989 12121',
      gender: 'Male',
      bloodGroup: 'A-',
      address: 'Sector 62, Noida',
      height: '179',
      weight: '81',
      sugarLevel: '116',
      allergies: 'Peanuts',
      emergencyContact: 'Ritu Verma - +91 97111 88776'
    },
    review: {
      diagnosis: 'Prediabetes monitoring',
      symptoms: 'Occasional fatigue',
      vitals: 'BP 126/84, Pulse 78',
      followUpDate: '',
      doctorNotes: 'Track fasting sugar and begin moderate exercise.'
    },
    prescriptions: [
      {
        id: 102,
        dateIssued: new Date().toISOString(),
        medication: 'Metformin',
        dosage: '500 mg',
        duration: '30 days',
        instructions: 'Take with breakfast'
      }
    ],
    reports: []
  }
];

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
  const [profileDraft, setProfileDraft] = useState(defaultProfile);
  const [reviewDraft, setReviewDraft] = useState(defaultReview);
  const [prescriptionDraft, setPrescriptionDraft] = useState(emptyPrescription);
  const [reportNote, setReportNote] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const storedRegistry = parseStoredRegistry();

      let appointments = [];
      if (token) {
        try {
          const response = await axios.get('/api/appointments/doctor', {
            headers: { Authorization: `Bearer ${token}` }
          });
          appointments = Array.isArray(response.data) ? response.data : [];
        } catch (error) {
          console.error('Unable to fetch doctor appointments for registry', error);
        }
      }

      const derivedPatients = {};

      appointments.forEach((item) => {
        const profile = {
          name:
            item.patientName ||
            item.patient?.name ||
            item.patient?.fullName ||
            'Patient',
          email: item.patientEmail || item.patient?.email || '',
          phoneNumber: item.patientPhone || item.patient?.phoneNumber || item.patient?.phone || '',
          gender: item.patient?.gender || '',
          bloodGroup: item.patient?.bloodGroup || '',
          address: item.patient?.address || '',
          height: item.patient?.height || '',
          weight: item.patient?.weight || '',
          sugarLevel: item.patient?.sugarLevel || '',
          allergies: item.patient?.allergies || '',
          emergencyContact: item.patient?.emergencyContact || ''
        };

        const key = createPatientKey(profile);
        if (!derivedPatients[key]) {
          derivedPatients[key] = {
            profile,
            review: { ...defaultReview },
            prescriptions: [],
            reports: []
          };
          return;
        }

        derivedPatients[key].profile = {
          ...mergeTruthyFields(derivedPatients[key].profile, profile)
        };
      });

      const mergedRegistry = { ...storedRegistry };

      demoPatients.forEach((demo) => {
        const key = createPatientKey(demo.profile);
        const existing = mergedRegistry[key] || {};
        mergedRegistry[key] = {
          profile: {
            ...defaultProfile,
            ...demo.profile,
            ...existing.profile
          },
          review: {
            ...defaultReview,
            ...demo.review,
            ...existing.review
          },
          prescriptions:
            Array.isArray(existing.prescriptions) && existing.prescriptions.length > 0
              ? existing.prescriptions
              : demo.prescriptions,
          reports: Array.isArray(existing.reports) ? existing.reports : []
        };
      });

      Object.entries(derivedPatients).forEach(([key, value]) => {
        const existing = mergedRegistry[key] || {};
        mergedRegistry[key] = {
          profile: {
            ...defaultProfile,
            ...value.profile,
            ...existing.profile
          },
          review: {
            ...defaultReview,
            ...existing.review
          },
          prescriptions: Array.isArray(existing.prescriptions)
            ? existing.prescriptions
            : [],
          reports: Array.isArray(existing.reports) ? existing.reports : []
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
          ) : (
            selectedPatient ? (
              <>
              <div className="registry-card">
                <div className="section-header">
                  <h2>Patient Profile</h2>
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
