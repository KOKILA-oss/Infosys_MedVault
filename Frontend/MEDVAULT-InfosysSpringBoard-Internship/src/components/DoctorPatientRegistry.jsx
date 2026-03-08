import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './DoctorPatientRegistry.css';

const REGISTRY_KEY = 'doctorPatientRegistry';
const SHOW_DUMMY_APPOINTMENTS = true;

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

const emptyCheckup = {
  bp: '',
  heartRate: '',
  sugarLevel: '',
  weight: ''
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
    reports: [],
    checkups: [
      {
        id: 301,
        measuredAt: new Date().toISOString(),
        bp: '120/80',
        heartRate: '74',
        sugarLevel: '104',
        weight: '72'
      }
    ],
    tips: [
      {
        id: 401,
        addedAt: new Date().toISOString(),
        text: 'Take rest for 5 days.'
      }
    ],
    visitRecords: []
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
    reports: [],
    checkups: [],
    tips: [],
    visitRecords: []
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
    reports: [],
    checkups: [],
    tips: [],
    visitRecords: []
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

const toIsoDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const dummyAppointments = [
  {
    id: 9001,
    patientName: 'Rahul Sharma',
    patientEmail: 'rahul.sharma@demo.com',
    patientPhone: '+91 98765 43210',
    appointmentDate: toIsoDate(0),
    appointmentTime: '09:30',
    status: 'PENDING',
    reason: 'Seasonal allergy follow-up',
    hospital: 'CityCare Hospital'
  },
  {
    id: 9004,
    patientName: 'Sneha Reddy',
    patientEmail: 'sneha.reddy@demo.com',
    patientPhone: '+91 98888 77665',
    appointmentDate: toIsoDate(0),
    appointmentTime: '10:45',
    status: 'APPROVED',
    reason: 'Post-treatment review',
    hospital: 'Metro Medical Center'
  },
  {
    id: 9002,
    patientName: 'Meera Nair',
    patientEmail: 'meera.nair@demo.com',
    patientPhone: '+91 97654 32109',
    appointmentDate: toIsoDate(1),
    appointmentTime: '11:00',
    status: 'APPROVED',
    reason: 'Routine annual checkup',
    hospital: 'Green Valley Clinic'
  },
  {
    id: 9003,
    patientName: 'Aman Verma',
    patientEmail: 'aman.verma@demo.com',
    patientPhone: '+91 98989 12121',
    appointmentDate: toIsoDate(3),
    appointmentTime: '16:15',
    status: 'RESCHEDULED',
    reason: 'Blood sugar review',
    hospital: 'CityCare Hospital'
  }
];

const parseAppointmentDateTime = (item) => {
  if (!item?.appointmentDate) return null;
  const value = new Date(`${item.appointmentDate}T${item.appointmentTime || '00:00'}`);
  if (!Number.isNaN(value.getTime())) return value;
  const fallback = new Date(item.appointmentDate);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const getHospitalName = (item) => {
  return (
    item?.hospitalName ||
    item?.hospital ||
    item?.doctor?.hospitalName ||
    item?.doctor?.hospital ||
    'Unassigned Hospital'
  );
};

const matchesPatientQuery = (patient, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return (
    (patient.name || '').toLowerCase().includes(normalizedQuery) ||
    (patient.email || '').toLowerCase().includes(normalizedQuery) ||
    (patient.phoneNumber || '').toLowerCase().includes(normalizedQuery)
  );
};

const hasAnyCheckupValue = (checkup) => {
  return (
    checkup.bp.trim() ||
    checkup.heartRate.trim() ||
    checkup.sugarLevel.trim() ||
    checkup.weight.trim()
  );
};

const buildMergedRegistry = (appointments, storedRegistry) => {
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
        reports: [],
        checkups: [],
        tips: []
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
      reports: Array.isArray(existing.reports) ? existing.reports : [],
      checkups:
        Array.isArray(existing.checkups) && existing.checkups.length > 0
          ? existing.checkups
          : demo.checkups || [],
      tips:
        Array.isArray(existing.tips) && existing.tips.length > 0
          ? existing.tips
          : demo.tips || [],
      visitRecords: Array.isArray(existing.visitRecords) ? existing.visitRecords : []
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
      reports: Array.isArray(existing.reports) ? existing.reports : [],
      checkups: Array.isArray(existing.checkups) ? existing.checkups : [],
      tips: Array.isArray(existing.tips) ? existing.tips : [],
      visitRecords: Array.isArray(existing.visitRecords) ? existing.visitRecords : []
    };
  });

  const keys = Object.keys(mergedRegistry).sort((a, b) => {
    const nameA = (mergedRegistry[a]?.profile?.name || '').toLowerCase();
    const nameB = (mergedRegistry[b]?.profile?.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return { mergedRegistry, keys };
};

const buildPatientAppointmentIndex = (appointments) => {
  const appointmentsByPatient = {};
  const hospitalsByPatient = {};

  appointments.forEach((item, index) => {
    const patientForKey = {
      name:
        item.patientName ||
        item.patient?.name ||
        item.patient?.fullName ||
        'Patient',
      email: item.patientEmail || item.patient?.email || '',
      phoneNumber: item.patientPhone || item.patient?.phoneNumber || item.patient?.phone || ''
    };

    const key = createPatientKey(patientForKey);
    const hospitalName = getHospitalName(item);
    const appointmentDateTime = parseAppointmentDateTime(item);
    const entry = {
      id: item.id || `${key}-${index}`,
      appointmentDate: item.appointmentDate || '',
      appointmentTime: item.appointmentTime || '',
      status: item.status || 'N/A',
      reason: item.reason || 'No reason provided',
      hospitalName,
      dateTime: appointmentDateTime
    };

    if (!appointmentsByPatient[key]) {
      appointmentsByPatient[key] = [];
    }
    appointmentsByPatient[key].push(entry);

    if (!hospitalsByPatient[key] || hospitalsByPatient[key] === 'Unassigned Hospital') {
      hospitalsByPatient[key] = hospitalName;
    }
  });

  Object.keys(appointmentsByPatient).forEach((key) => {
    appointmentsByPatient[key].sort((a, b) => {
      if (!a.dateTime && !b.dateTime) return 0;
      if (!a.dateTime) return 1;
      if (!b.dateTime) return -1;
      return a.dateTime - b.dateTime;
    });
  });

  return { appointmentsByPatient, hospitalsByPatient };
};

const DoctorPatientRegistry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState({});
  const [patientOrder, setPatientOrder] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState({});
  const [patientHospitals, setPatientHospitals] = useState({});
  const [selectedPatientKey, setSelectedPatientKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profileDraft, setProfileDraft] = useState(defaultProfile);
  const [reviewDraft, setReviewDraft] = useState(defaultReview);
  const [prescriptionDraft, setPrescriptionDraft] = useState(emptyPrescription);
  const [checkupDraft, setCheckupDraft] = useState(emptyCheckup);
  const [tipDraft, setTipDraft] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [visitWindowOpen, setVisitWindowOpen] = useState(false);
  const [viewingPastAppointmentId, setViewingPastAppointmentId] = useState('');

  const deepLinkTargetKey = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const patient = {
      name: params.get('patientName') || 'Patient',
      email: params.get('patientEmail') || '',
      phoneNumber: params.get('patientPhone') || ''
    };

    if (!patient.name && !patient.email && !patient.phoneNumber) return '';
    return createPatientKey(patient);
  }, [location.search]);

  const shouldOpenVisitWindowFromLink = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('openWindow') === '1';
  }, [location.search]);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const storedRegistry = parseStoredRegistry();

      let appointments = [];
      if (token) {
        try {
          const response = await axios.get('/api/doctor/appointments/doctor', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const apiAppointments = Array.isArray(response.data) ? response.data : [];
          appointments =
            apiAppointments.length > 0
              ? apiAppointments
              : SHOW_DUMMY_APPOINTMENTS
                ? dummyAppointments
                : [];
        } catch (error) {
          console.error('Unable to fetch doctor appointments for registry', error);
          appointments = SHOW_DUMMY_APPOINTMENTS ? dummyAppointments : [];
        }
      } else if (SHOW_DUMMY_APPOINTMENTS) {
        appointments = dummyAppointments;
      }

      const { appointmentsByPatient, hospitalsByPatient } = buildPatientAppointmentIndex(appointments);

      const { mergedRegistry, keys } = buildMergedRegistry(appointments, storedRegistry);

      setRegistry(mergedRegistry);
      setPatientOrder(keys);
      setPatientAppointments(appointmentsByPatient);
      setPatientHospitals(hospitalsByPatient);

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
    setCheckupDraft(emptyCheckup);
    setTipDraft('');
    setVisitWindowOpen(false);
    setViewingPastAppointmentId('');
  }, [selectedPatientKey, registry]);

  useEffect(() => {
    if (!deepLinkTargetKey || loading || patientOrder.length === 0) return;
    if (!patientOrder.includes(deepLinkTargetKey)) return;

    if (selectedPatientKey !== deepLinkTargetKey) {
      setSelectedPatientKey(deepLinkTargetKey);
      return;
    }

    if (shouldOpenVisitWindowFromLink) {
      setVisitWindowOpen(true);
      setSearchTerm('');
      navigate('/doctor-patient-registry', { replace: true });
    }
  }, [
    deepLinkTargetKey,
    shouldOpenVisitWindowFromLink,
    loading,
    patientOrder,
    selectedPatientKey,
    navigate
  ]);

  const visiblePatientKeys = useMemo(() => {
    return patientOrder
      .filter((key) => {
        const patient = registry[key]?.profile || {};
        return matchesPatientQuery(patient, searchTerm);
      })
      .sort((keyA, keyB) => {
        const hospitalA = (patientHospitals[keyA] || 'Unassigned Hospital').toLowerCase();
        const hospitalB = (patientHospitals[keyB] || 'Unassigned Hospital').toLowerCase();
        const hospitalCompare = hospitalA.localeCompare(hospitalB);
        if (hospitalCompare !== 0) return hospitalCompare;
        const nameA = (registry[keyA]?.profile?.name || '').toLowerCase();
        const nameB = (registry[keyB]?.profile?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [patientOrder, registry, searchTerm, patientHospitals]);

  const selectedPatient = selectedPatientKey ? registry[selectedPatientKey] : null;

  const selectedPatientAppointments = useMemo(() => {
    const list = selectedPatientKey ? patientAppointments[selectedPatientKey] || [] : [];
    const now = new Date();

    const upcoming = list.filter((item) => {
      if (!item.dateTime) return true;
      return item.dateTime >= now;
    });

    const past = list
      .filter((item) => item.dateTime && item.dateTime < now)
      .sort((a, b) => b.dateTime - a.dateTime);

    return { upcoming, past };
  }, [selectedPatientKey, patientAppointments]);

  const selectedPastAppointmentDetails = useMemo(() => {
    if (!viewingPastAppointmentId) return null;
    return (
      selectedPatientAppointments.past.find(
        (item) => String(item.id) === String(viewingPastAppointmentId)
      ) || null
    );
  }, [viewingPastAppointmentId, selectedPatientAppointments]);

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
    if (!selectedPatientKey || !selectedPatient || !prescriptionDraft.medication.trim()) return;

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

  const addCheckup = () => {
    if (!selectedPatientKey || !selectedPatient || !hasAnyCheckupValue(checkupDraft)) {
      return;
    }

    const entry = {
      id: Date.now(),
      measuredAt: new Date().toISOString(),
      bp: checkupDraft.bp.trim(),
      heartRate: checkupDraft.heartRate.trim(),
      sugarLevel: checkupDraft.sugarLevel.trim(),
      weight: checkupDraft.weight.trim()
    };

    const nextRegistry = {
      ...registry,
      [selectedPatientKey]: {
        ...selectedPatient,
        checkups: [entry, ...(selectedPatient.checkups || [])]
      }
    };

    persistRegistry(nextRegistry);
    setCheckupDraft(emptyCheckup);
  };

  const addTip = () => {
    if (!selectedPatientKey || !selectedPatient || !tipDraft.trim()) return;

    const entry = {
      id: Date.now(),
      addedAt: new Date().toISOString(),
      text: tipDraft.trim()
    };

    const nextRegistry = {
      ...registry,
      [selectedPatientKey]: {
        ...selectedPatient,
        tips: [entry, ...(selectedPatient.tips || [])]
      }
    };

    persistRegistry(nextRegistry);
    setTipDraft('');
  };


  return (
    <div className="doctor-registry-page">
      <header className="registry-header">
        <div>
          <h1>Patient Registry</h1>
          <p>Review profiles, clinical notes, checkups, prescriptions, reports, and patient tips in one place.</p>
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
                    <span>{patientHospitals[key] || 'Unassigned Hospital'}</span>
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
                  <h2>Patient Details</h2>
                  <span className="muted">Hospital: {patientHospitals[selectedPatientKey] || 'Unassigned Hospital'}</span>
                </div>

                <div className="patient-details-grid">
                  {Object.entries(selectedPatient.profile || {}).map(([field, value]) => (
                    <div className="detail-item" key={field}>
                      <span>{formatFieldLabel(field)}</span>
                      <strong>{value || 'N/A'}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="registry-card">
                <h2>Appointments (Past & Upcoming)</h2>
                <div className="appointments-columns">
                  <div>
                    <h3 className="subsection-title">Upcoming Appointments</h3>
                    <div className="list-stack">
                      {selectedPatientAppointments.upcoming.length === 0 ? (
                        <p className="muted">No upcoming appointments.</p>
                      ) : (
                        selectedPatientAppointments.upcoming.map((item) => (
                          <div className="list-row" key={`upcoming-${item.id}`}>
                            <strong>{formatDateTime(item.dateTime)}</strong>
                            <span>{item.hospitalName}</span>
                            <span>Status: {item.status}</span>
                            <small>{item.reason}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="subsection-title">Past Appointments</h3>
                    <div className="list-stack">
                      {selectedPatientAppointments.past.length === 0 ? (
                        <p className="muted">No past appointments.</p>
                      ) : (
                        selectedPatientAppointments.past.map((item) => (
                          <div className="list-row" key={`past-${item.id}`}>
                            <strong>{formatDateTime(item.dateTime)}</strong>
                            <span>{item.hospitalName}</span>
                            <span>Status: {item.status}</span>
                            <small>{item.reason}</small>
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => setViewingPastAppointmentId(String(item.id))}
                            >
                              See Details
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedPastAppointmentDetails ? (
                <div className="registry-card">
                  <div className="section-header">
                    <h2>Past Visit Record</h2>
                    <span className="muted">
                      {formatDateTime(selectedPastAppointmentDetails.dateTime)}
                    </span>
                  </div>

                  <div className="record-block">
                    <h3 className="subsection-title">Patient Profile</h3>
                    <div className="patient-details-grid">
                      {Object.entries(selectedPatient.profile || {}).map(([field, value]) => (
                        <div className="detail-item" key={`record-profile-${field}`}>
                          <span>{formatFieldLabel(field)}</span>
                          <strong>{value || 'N/A'}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="record-block">
                    <h3 className="subsection-title">Clinical Review</h3>
                    <div className="patient-details-grid">
                      {Object.entries(selectedPatient.review || {}).map(([field, value]) => (
                        <div className="detail-item" key={`record-review-${field}`}>
                          <span>{formatFieldLabel(field)}</span>
                          <strong>{value || 'N/A'}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="record-grid-2">
                    <div>
                      <h3 className="subsection-title">Prescriptions</h3>
                      <div className="list-stack">
                        {(selectedPatient.prescriptions || []).length === 0 ? (
                          <p className="muted">No prescriptions recorded.</p>
                        ) : (
                          selectedPatient.prescriptions.map((item) => (
                            <div className="list-row" key={`record-rx-${item.id}`}>
                              <strong>{item.medication || 'N/A'}</strong>
                              <span>{item.dosage || 'No dosage'} • {item.duration || 'No duration'}</span>
                              <span>{item.instructions || 'No instructions'}</span>
                              <small>Added: {formatDateTime(item.dateIssued)}</small>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="subsection-title">Basic Check up</h3>
                      <div className="list-stack">
                        {(selectedPatient.checkups || []).length === 0 ? (
                          <p className="muted">No checkups recorded.</p>
                        ) : (
                          selectedPatient.checkups.map((item) => (
                            <div className="list-row" key={`record-check-${item.id}`}>
                              <strong>BP: {item.bp || 'N/A'}</strong>
                              <span>
                                Heart Rate: {item.heartRate || 'N/A'} • Sugar: {item.sugarLevel || 'N/A'} • Weight: {item.weight || 'N/A'}
                              </span>
                              <small>Measured: {formatDateTime(item.measuredAt)}</small>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="record-grid-2">
                    <div>
                      <h3 className="subsection-title">Tips for patient</h3>
                      <div className="list-stack">
                        {(selectedPatient.tips || []).length === 0 ? (
                          <p className="muted">No tips recorded.</p>
                        ) : (
                          selectedPatient.tips.map((item) => (
                            <div className="list-row" key={`record-tip-${item.id}`}>
                              <strong>{item.text || 'N/A'}</strong>
                              <small>Added: {formatDateTime(item.addedAt)}</small>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="subsection-title">Reports (PDF)</h3>
                      <div className="list-stack">
                        {(selectedPatient.reports || []).length === 0 ? (
                          <p className="muted">No reports recorded.</p>
                        ) : (
                          selectedPatient.reports.map((item) => (
                            <div className="list-row" key={`record-report-${item.id}`}>
                              <strong>{item.fileName || 'Report'}</strong>
                              <span>{item.note || 'No note added'}</span>
                              <small>Uploaded: {formatDateTime(item.uploadedAt)}</small>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="registry-card">
                <div className="section-header">
                  <h2>Visit Entry</h2>
                  <button
                    className="primary-btn"
                    onClick={() => setVisitWindowOpen((prev) => !prev)}
                  >
                    {visitWindowOpen ? 'Close Appointment Window' : 'Add New Appointment Window'}
                  </button>
                </div>
                <p className="muted">
                  Open this window to add doctor notes, prescriptions, checkups, patient tips, and reports for this visit.
                </p>
              </div>

              {visitWindowOpen ? (
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
                <h2>Basic check up</h2>
                <div className="checkup-form">
                  <input
                    type="text"
                    placeholder="BP (e.g. 120/80)"
                    value={checkupDraft.bp}
                    onChange={(event) =>
                      setCheckupDraft((prev) => ({ ...prev, bp: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Heart rate"
                    value={checkupDraft.heartRate}
                    onChange={(event) =>
                      setCheckupDraft((prev) => ({ ...prev, heartRate: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Sugar level"
                    value={checkupDraft.sugarLevel}
                    onChange={(event) =>
                      setCheckupDraft((prev) => ({ ...prev, sugarLevel: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Weight"
                    value={checkupDraft.weight}
                    onChange={(event) =>
                      setCheckupDraft((prev) => ({ ...prev, weight: event.target.value }))
                    }
                  />
                  <button className="primary-btn" onClick={addCheckup}>
                    Add Checkup
                  </button>
                </div>

                <div className="list-stack">
                  {(selectedPatient.checkups || []).length === 0 ? (
                    <p className="muted">No checkup entries added yet.</p>
                  ) : (
                    selectedPatient.checkups.map((item) => (
                      <div className="list-row" key={item.id}>
                        <strong>BP: {item.bp || 'N/A'}</strong>
                        <span>
                          Heart Rate: {item.heartRate || 'N/A'} • Sugar: {item.sugarLevel || 'N/A'} • Weight:{' '}
                          {item.weight || 'N/A'}
                        </span>
                        <small>Measured: {formatDateTime(item.measuredAt)}</small>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="registry-card">
                <h2>Tips for patient</h2>
                <div className="tips-form">
                  <textarea
                    rows="3"
                    placeholder="Example: Take rest for 5 days"
                    value={tipDraft}
                    onChange={(event) => setTipDraft(event.target.value)}
                  />
                  <button className="primary-btn" onClick={addTip}>
                    Add Tip
                  </button>
                </div>

                <div className="list-stack">
                  {(selectedPatient.tips || []).length === 0 ? (
                    <p className="muted">No tips added yet.</p>
                  ) : (
                    selectedPatient.tips.map((item) => (
                      <div className="list-row" key={item.id}>
                        <strong>{item.text}</strong>
                        <small>Added: {formatDateTime(item.addedAt)}</small>
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
              ) : null}
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
