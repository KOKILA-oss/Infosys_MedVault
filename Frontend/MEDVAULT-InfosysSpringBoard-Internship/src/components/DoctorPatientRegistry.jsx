import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorPatientRegistry.css';

const emptyReview = {
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

const formatFieldLabel = (field) => {
  const withSpaces = field
    .split('')
    .map((char, index) => (index > 0 && char >= 'A' && char <= 'Z' ? ` ${char}` : char))
    .join('');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

const parseAppointmentDateTime = (item) => {
  if (!item?.appointmentDate) return null;
  const value = new Date(`${item.appointmentDate}T${item.appointmentTime || '00:00'}`);
  return Number.isNaN(value.getTime()) ? null : value;
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
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
  return Boolean(
    checkup.bp.trim() ||
    checkup.heartRate.trim() ||
    checkup.sugarLevel.trim() ||
    checkup.weight.trim()
  );
};

const DoctorPatientRegistry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visitWindowOpen, setVisitWindowOpen] = useState(false);
  const [viewingPastAppointmentId, setViewingPastAppointmentId] = useState('');
  const [reviewDraft, setReviewDraft] = useState(emptyReview);
  const [prescriptionDraft, setPrescriptionDraft] = useState(emptyPrescription);
  const [checkupDraft, setCheckupDraft] = useState(emptyCheckup);
  const [tipDraft, setTipDraft] = useState('');
  const [draftPrescriptions, setDraftPrescriptions] = useState([]);
  const [draftCheckups, setDraftCheckups] = useState([]);
  const [draftTips, setDraftTips] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testReports, setTestReports] = useState([]);

  const loadPatients = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await axios.get('/api/doctor/appointments/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const list = Array.isArray(response.data) ? response.data : [];
      setPatients(list);
      setSelectedPatientId((current) => {
        if (current && list.some((item) => String(item.patientId) === String(current))) return current;
        return list[0] ? String(list[0].patientId) : '';
      });
    } catch (error) {
      console.error('Failed to load doctor patient registry', error);
      setPatients([]);
      setLoadError('Unable to load the patient registry right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const visiblePatients = useMemo(() => patients.filter((patient) => matchesPatientQuery(patient, searchTerm)), [patients, searchTerm]);

  const selectedPatient = useMemo(() => {
    return patients.find((item) => String(item.patientId) === String(selectedPatientId)) || null;
  }, [patients, selectedPatientId]);

  const selectedPatientAppointments = useMemo(() => {
    const appointments = Array.isArray(selectedPatient?.appointments) ? selectedPatient.appointments : [];
    const now = new Date();

    const upcoming = appointments
      .map((item) => ({ ...item, dateTime: parseAppointmentDateTime(item) }))
      .filter((item) => !item.dateTime || item.dateTime >= now);

    const past = appointments
      .map((item) => ({ ...item, dateTime: parseAppointmentDateTime(item) }))
      .filter((item) => item.dateTime && item.dateTime < now)
      .sort((first, second) => second.dateTime - first.dateTime);

    return { upcoming, past };
  }, [selectedPatient]);

  useEffect(() => {
    if (!selectedPatientAppointments.past.length) {
      setViewingPastAppointmentId('');
      return;
    }

    setViewingPastAppointmentId((current) => {
      if (current && selectedPatientAppointments.past.some((item) => String(item.id) === String(current))) {
        return current;
      }
      return String(selectedPatientAppointments.past[0].id);
    });
  }, [selectedPatientAppointments]);

  useEffect(() => {
    setVisitWindowOpen(false);
    setReviewDraft(emptyReview);
    setPrescriptionDraft(emptyPrescription);
    setCheckupDraft(emptyCheckup);
    setTipDraft('');
    setDraftPrescriptions([]);
    setDraftCheckups([]);
    setDraftTips([]);
    setFeedbackMessage('');
  }, [selectedPatientId]);

  const selectedPastAppointment = useMemo(() => {
    return selectedPatientAppointments.past.find((item) => String(item.id) === String(viewingPastAppointmentId)) || null;
  }, [selectedPatientAppointments, viewingPastAppointmentId]);

  const selectedPastVisitEntries = useMemo(() => {
    const entries = Array.isArray(selectedPatient?.visitEntries) ? selectedPatient.visitEntries : [];
    if (!selectedPastAppointment) return [];
    return entries.filter((entry) => String(entry.appointmentId) === String(selectedPastAppointment.id));
  }, [selectedPatient, selectedPastAppointment]);

  const selectedPatientReports = useMemo(() => {
    return [...testReports].sort((first, second) => new Date(second?.createdAt || 0) - new Date(first?.createdAt || 0));
  }, [testReports]);

  const commonTestReports = useMemo(
    () => selectedPatientReports.filter((item) => !item.appointmentId),
    [selectedPatientReports]
  );

  const selectedAppointmentReports = useMemo(() => {
    if (!selectedPastAppointment) return [];
    return selectedPatientReports.filter((item) => String(item.appointmentId || '') === String(selectedPastAppointment.id));
  }, [selectedPastAppointment, selectedPatientReports]);

  useEffect(() => {
    const loadTestReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !selectedPatient?.patientId) {
          setTestReports([]);
          return;
        }

        const response = await axios.get(`/api/doctor/records/patient/${selectedPatient.patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { category: 'TEST_REPORT' }
        });

        setTestReports(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to load patient test reports', error);
        setTestReports([]);
      }
    };

    loadTestReports();
  }, [selectedPatient]);

  const handleViewTestReport = async (recordId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`/api/doctor/records/${recordId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Failed to open patient test report', error);
    }
  };

  const addPrescriptionDraft = () => {
    if (!prescriptionDraft.medication.trim()) return;
    setDraftPrescriptions((current) => [
      ...current,
      { ...prescriptionDraft, id: Date.now() + current.length, dateIssued: new Date().toISOString() }
    ]);
    setPrescriptionDraft(emptyPrescription);
  };

  const addCheckupDraft = () => {
    if (!hasAnyCheckupValue(checkupDraft)) return;
    setDraftCheckups((current) => [
      ...current,
      { ...checkupDraft, id: Date.now() + current.length, measuredAt: new Date().toISOString() }
    ]);
    setCheckupDraft(emptyCheckup);
  };

  const addTipDraft = () => {
    if (!tipDraft.trim()) return;
    setDraftTips((current) => [
      ...current,
      { id: Date.now() + current.length, text: tipDraft.trim(), addedAt: new Date().toISOString() }
    ]);
    setTipDraft('');
  };

  const handleSaveVisitEntry = async () => {
    if (!selectedPatient) return;
    if (!selectedPastAppointment) {
      setFeedbackMessage('Select a past appointment before saving a visit entry.');
      return;
    }
    if (
      !reviewDraft.diagnosis.trim() &&
      !reviewDraft.symptoms.trim() &&
      !reviewDraft.vitals.trim() &&
      !reviewDraft.followUpDate &&
      !reviewDraft.doctorNotes.trim() &&
      draftPrescriptions.length === 0 &&
      draftCheckups.length === 0 &&
      draftTips.length === 0
    ) {
      setFeedbackMessage('Add at least one clinical review, prescription, checkup, or tip.');
      return;
    }

    try {
      setSaving(true);
      setFeedbackMessage('');
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/doctor/appointments/patients/${selectedPatient.patientId}/visit-entry`,
        {
          appointmentId: selectedPastAppointment.id,
          ...reviewDraft,
          prescriptions: draftPrescriptions,
          checkups: draftCheckups,
          tips: draftTips
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReviewDraft(emptyReview);
      setPrescriptionDraft(emptyPrescription);
      setCheckupDraft(emptyCheckup);
      setTipDraft('');
      setDraftPrescriptions([]);
      setDraftCheckups([]);
      setDraftTips([]);
      setFeedbackMessage('Visit entry saved successfully.');
      await loadPatients();
    } catch (error) {
      console.error('Failed to save visit entry', error);
      setFeedbackMessage(error.response?.data?.message || 'Unable to save this visit entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="doctor-registry-page">
      <header className="registry-header">
        <div>
          <h1>Patient Registry</h1>
          <p>Patients you have already consulted, along with their past and upcoming appointments.</p>
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
            {loading ? (
              <p className="muted">Loading patients...</p>
            ) : visiblePatients.length === 0 ? (
              <p className="muted">{loadError || 'No completed-patient history found yet.'}</p>
            ) : (
              visiblePatients.map((patient) => (
                <button
                  key={patient.patientId}
                  type="button"
                  className={`patient-list-item ${String(selectedPatientId) === String(patient.patientId) ? 'active' : ''}`}
                  onClick={() => setSelectedPatientId(String(patient.patientId))}
                >
                  <strong>{patient.name}</strong>
                  <span>{patient.email || 'No email'}</span>
                  <span>{patient.phoneNumber || 'No phone'}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="registry-content">
          {selectedPatient ? (
            <>
              <div className="registry-card">
                <div className="section-header">
                  <div>
                    <h2>{selectedPatient.name}</h2>
                    <p className="muted">
                      {selectedPatient.email || 'No email'}
                      {selectedPatient.phoneNumber ? ` • ${selectedPatient.phoneNumber}` : ''}
                    </p>
                  </div>
                  <span className="muted">{selectedPatient.appointmentCount} appointments</span>
                </div>

                <div className="patient-details-grid">
                  {['gender', 'bloodGroup', 'height', 'weight', 'sugarLevel', 'address', 'allergies', 'emergencyContact'].map((field) => (
                    <div className="detail-item" key={field}>
                      <span>{formatFieldLabel(field)}</span>
                      <strong>{selectedPatient[field] || 'N/A'}</strong>
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
                            <span>Status: {item.status}</span>
                            <small>{item.reason || 'No reason provided'}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="subsection-title">Past Appointments</h3>
                    <div className="list-stack selectable-list">
                      {selectedPatientAppointments.past.length === 0 ? (
                        <p className="muted">No past appointments.</p>
                      ) : (
                        selectedPatientAppointments.past.map((item) => (
                          <button
                            type="button"
                            key={`past-${item.id}`}
                            className={`list-row ${String(viewingPastAppointmentId) === String(item.id) ? 'active' : ''}`}
                            onClick={() => setViewingPastAppointmentId(String(item.id))}
                          >
                            <div>
                              <strong>{formatDateTime(item.dateTime)}</strong>
                              <span>Status: {item.status}</span>
                              <small>{item.reason || 'No reason provided'}</small>
                            </div>
                            <span className="link-btn">Select</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedPastAppointment ? (
                <div className="registry-card">
                  <div className="section-header">
                    <h2>Past Visit Record</h2>
                    <span className="muted">{formatDateTime(selectedPastAppointment.dateTime)}</span>
                  </div>

                  {selectedPastVisitEntries.length === 0 ? (
                    <p className="muted">No doctor visit entry saved for this appointment yet.</p>
                  ) : (
                    selectedPastVisitEntries.map((entry) => (
                      <div className="record-block" key={entry.id}>
                        <div className="record-block">
                          <h3 className="subsection-title">Clinical Review</h3>
                          <div className="patient-details-grid">
                            {[
                              ['Diagnosis', entry.diagnosis],
                              ['Symptoms', entry.symptoms],
                              ['Vitals', entry.vitals],
                              ['Follow Up Date', entry.followUpDate],
                              ['Doctor Notes', entry.doctorNotes]
                            ].map(([label, value]) => (
                              <div className="detail-item" key={`${entry.id}-${label}`}>
                                <span>{label}</span>
                                <strong>{value || 'N/A'}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="record-grid-2">
                          <div>
                            <h3 className="subsection-title">Prescriptions</h3>
                            <div className="list-stack">
                              {(entry.prescriptions || []).length === 0 ? (
                                <p className="muted">No prescriptions recorded.</p>
                              ) : (
                                entry.prescriptions.map((item) => (
                                  <div className="list-row" key={`${entry.id}-rx-${item.id}`}>
                                    <strong>{item.medication || 'N/A'}</strong>
                                    <span>{item.dosage || 'No dosage'} • {item.duration || 'No duration'}</span>
                                    <small>{item.instructions || 'No instructions'}</small>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="subsection-title">Basic Check up</h3>
                            <div className="list-stack">
                              {(entry.checkups || []).length === 0 ? (
                                <p className="muted">No checkups recorded.</p>
                              ) : (
                                entry.checkups.map((item) => (
                                  <div className="list-row" key={`${entry.id}-check-${item.id}`}>
                                    <strong>BP: {item.bp || 'N/A'}</strong>
                                    <span>Heart Rate: {item.heartRate || 'N/A'} • Sugar: {item.sugarLevel || 'N/A'} • Weight: {item.weight || 'N/A'}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="record-block">
                          <h3 className="subsection-title">Tips for patient</h3>
                          <div className="list-stack">
                            {(entry.tips || []).length === 0 ? (
                              <p className="muted">No tips recorded.</p>
                            ) : (
                              entry.tips.map((item) => (
                                <div className="list-row" key={`${entry.id}-tip-${item.id}`}>
                                  <strong>{item.text || 'N/A'}</strong>
                                  <small>Added: {formatDateTime(item.addedAt)}</small>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              <div className="registry-card">
                <div className="section-header">
                  <h2>Test Reports</h2>
                  <span className="muted">{selectedPatientReports.length} reports visible to you</span>
                </div>
                <p className="muted">Common reports are shown for the patient, and appointment-linked reports are shown under the selected completed appointment.</p>

                <div className="record-grid-2">
                  <div>
                    <h3 className="subsection-title">Common Test Reports</h3>
                    <div className="list-stack">
                      {commonTestReports.length === 0 ? (
                        <p className="muted">No common test reports shared with you yet.</p>
                      ) : (
                        commonTestReports.map((item) => (
                          <div className="list-row" key={`common-${item.id || item.createdAt}`}>
                            <strong>{item.fileName || item.title || 'Test report'}</strong>
                            <span>{item.description || 'No note added'}</span>
                            <small>Uploaded: {formatDateTime(item.createdAt)}</small>
                            <button type="button" className="link-btn" onClick={() => handleViewTestReport(item.id)}>
                              View PDF
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="subsection-title">
                      {selectedPastAppointment ? 'Reports For Selected Completed Appointment' : 'Select a completed appointment'}
                    </h3>
                    <div className="list-stack">
                      {!selectedPastAppointment ? (
                        <p className="muted">Choose a completed appointment to see its specific test reports.</p>
                      ) : selectedAppointmentReports.length === 0 ? (
                        <p className="muted">No appointment-specific test reports for this completed appointment.</p>
                      ) : (
                        selectedAppointmentReports.map((item) => (
                          <div className="list-row" key={`appt-${item.id || item.createdAt}`}>
                            <strong>{item.fileName || item.title || 'Test report'}</strong>
                            <span>{item.description || 'No note added'}</span>
                            <small>Uploaded: {formatDateTime(item.createdAt)}</small>
                            <button type="button" className="link-btn" onClick={() => handleViewTestReport(item.id)}>
                              View PDF
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="registry-card">
                <div className="section-header">
                  <h2>Visit Entry</h2>
                  <button className="primary-btn" onClick={() => setVisitWindowOpen((prev) => !prev)}>
                    {visitWindowOpen ? 'Close Appointment Window' : 'Add New Appointment Window'}
                  </button>
                </div>
                <p className="muted">Save clinical review, prescriptions, checkups, and patient tips for the selected past appointment.</p>
              </div>

              {visitWindowOpen ? (
                <>
                  <div className="registry-card">
                    <div className="section-header">
                      <h2>Clinical Review</h2>
                      <button className="primary-btn" onClick={handleSaveVisitEntry} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Visit Entry'}
                      </button>
                    </div>

                    <div className="review-grid">
                      <label>
                        <span>Diagnosis</span>
                        <input type="text" value={reviewDraft.diagnosis} onChange={(event) => setReviewDraft((prev) => ({ ...prev, diagnosis: event.target.value }))} />
                      </label>
                      <label>
                        <span>Symptoms</span>
                        <input type="text" value={reviewDraft.symptoms} onChange={(event) => setReviewDraft((prev) => ({ ...prev, symptoms: event.target.value }))} />
                      </label>
                      <label>
                        <span>Vitals</span>
                        <input type="text" value={reviewDraft.vitals} onChange={(event) => setReviewDraft((prev) => ({ ...prev, vitals: event.target.value }))} />
                      </label>
                      <label>
                        <span>Follow-up Date</span>
                        <input type="date" value={reviewDraft.followUpDate} onChange={(event) => setReviewDraft((prev) => ({ ...prev, followUpDate: event.target.value }))} />
                      </label>
                      <label className="full-width">
                        <span>Doctor Notes</span>
                        <textarea rows="4" value={reviewDraft.doctorNotes} onChange={(event) => setReviewDraft((prev) => ({ ...prev, doctorNotes: event.target.value }))} />
                      </label>
                    </div>
                  </div>

                  <div className="registry-card">
                    <h2>Prescriptions</h2>
                    <div className="prescription-form">
                      <input type="text" placeholder="Medicine" value={prescriptionDraft.medication} onChange={(event) => setPrescriptionDraft((prev) => ({ ...prev, medication: event.target.value }))} />
                      <input type="text" placeholder="Dosage" value={prescriptionDraft.dosage} onChange={(event) => setPrescriptionDraft((prev) => ({ ...prev, dosage: event.target.value }))} />
                      <input type="text" placeholder="Duration" value={prescriptionDraft.duration} onChange={(event) => setPrescriptionDraft((prev) => ({ ...prev, duration: event.target.value }))} />
                      <input type="text" placeholder="Instructions" value={prescriptionDraft.instructions} onChange={(event) => setPrescriptionDraft((prev) => ({ ...prev, instructions: event.target.value }))} />
                      <button className="primary-btn" onClick={addPrescriptionDraft}>Add Prescription</button>
                    </div>

                    <div className="list-stack">
                      {draftPrescriptions.length === 0 ? (
                        <p className="muted">No prescriptions added yet.</p>
                      ) : (
                        draftPrescriptions.map((item) => (
                          <div className="list-row" key={item.id}>
                            <strong>{item.medication}</strong>
                            <span>{item.dosage || 'No dosage'} • {item.duration || 'No duration'}</span>
                            <small>{item.instructions || 'No instructions'}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="registry-card">
                    <h2>Basic check up</h2>
                    <div className="checkup-form">
                      <input type="text" placeholder="BP (e.g. 120/80)" value={checkupDraft.bp} onChange={(event) => setCheckupDraft((prev) => ({ ...prev, bp: event.target.value }))} />
                      <input type="text" placeholder="Heart rate" value={checkupDraft.heartRate} onChange={(event) => setCheckupDraft((prev) => ({ ...prev, heartRate: event.target.value }))} />
                      <input type="text" placeholder="Sugar level" value={checkupDraft.sugarLevel} onChange={(event) => setCheckupDraft((prev) => ({ ...prev, sugarLevel: event.target.value }))} />
                      <input type="text" placeholder="Weight" value={checkupDraft.weight} onChange={(event) => setCheckupDraft((prev) => ({ ...prev, weight: event.target.value }))} />
                      <button className="primary-btn" onClick={addCheckupDraft}>Add Checkup</button>
                    </div>

                    <div className="list-stack">
                      {draftCheckups.length === 0 ? (
                        <p className="muted">No checkup entries added yet.</p>
                      ) : (
                        draftCheckups.map((item) => (
                          <div className="list-row" key={item.id}>
                            <strong>BP: {item.bp || 'N/A'}</strong>
                            <span>Heart Rate: {item.heartRate || 'N/A'} • Sugar: {item.sugarLevel || 'N/A'} • Weight: {item.weight || 'N/A'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="registry-card">
                    <h2>Tips for patient</h2>
                    <div className="tips-form">
                      <textarea rows="3" placeholder="Example: Take rest for 5 days" value={tipDraft} onChange={(event) => setTipDraft(event.target.value)} />
                      <button className="primary-btn" onClick={addTipDraft}>Add Tip</button>
                    </div>

                    <div className="list-stack">
                      {draftTips.length === 0 ? (
                        <p className="muted">No tips added yet.</p>
                      ) : (
                        draftTips.map((item) => (
                          <div className="list-row" key={item.id}>
                            <strong>{item.text}</strong>
                            <small>Added: {formatDateTime(item.addedAt)}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {feedbackMessage ? <p className="muted">{feedbackMessage}</p> : null}
                </>
              ) : null}
            </>
          ) : (
            <div className="registry-card">No completed-patient history is available for this doctor yet.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DoctorPatientRegistry;
