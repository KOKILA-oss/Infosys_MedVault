import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './DoctorPrescriptions.css';

const DoctorPrescriptions = () => {
  const token = localStorage.getItem('token');
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [nextCheckupDate, setNextCheckupDate] = useState('');
  const [doctorTip, setDoctorTip] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      if (!token) return;
      try {
        const resp = await axios.get('/api/doctor/appointments/patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = Array.isArray(resp.data) ? resp.data : [];
        setPatients(list);
        if (list.length > 0) {
          setSelectedPatientId(String(list[0].patientId));
        }
      } catch (error) {
        console.error('Failed to load patients', error);
        setMessage('Unable to load patients right now.');
      }
    };

    loadPatients();
  }, [token]);

  const selectedPatient = useMemo(
    () => patients.find((p) => String(p.patientId) === String(selectedPatientId)),
    [patients, selectedPatientId]
  );

  const completedAppointments = useMemo(() => {
    if (!selectedPatient || !Array.isArray(selectedPatient.appointments)) return [];
    return selectedPatient.appointments.filter(
      (appt) => String(appt.status || '').toUpperCase() === 'COMPLETED'
    );
  }, [selectedPatient]);

  const pastEntriesForAppointment = useMemo(() => {
    if (!selectedPatient || !Array.isArray(selectedPatient.visitEntries)) return [];
    if (!selectedAppointmentId) return [];
    return selectedPatient.visitEntries.filter(
      (entry) => String(entry.appointmentId) === String(selectedAppointmentId)
    );
  }, [selectedPatient, selectedAppointmentId]);

  useEffect(() => {
    if (completedAppointments.length > 0) {
      setSelectedAppointmentId(String(completedAppointments[0].id));
    } else {
      setSelectedAppointmentId('');
    }
  }, [completedAppointments]);

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedAppointmentId) {
      setMessage('Choose a patient and a completed appointment first.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        appointmentId: Number(selectedAppointmentId),
        followUpDate: nextCheckupDate || null,
        doctorNotes: notes || null,
        prescriptions: prescriptionText
          ? [
              {
                medication: prescriptionText,
                dosage: '',
                duration: '',
                instructions: doctorTip || ''
              }
            ]
          : [],
        checkups: [],
        tips: doctorTip ? [{ text: doctorTip }] : []
      };

      await axios.post(
        `/api/doctor/appointments/patients/${selectedPatient.patientId}/visit-entry`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Saved to the patient registry for this appointment.');
      setPrescriptionText('');
      setDoctorTip('');
      setNextCheckupDate('');
      setNotes('');
    } catch (error) {
      console.error('Failed to save visit entry', error);
      setMessage(error.response?.data?.message || 'Could not save this entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="doctor-prescriptions-page">
      <header className="dp-header">
        <div>
          <h1>Prescription & Follow-up</h1>
          <p>Attach prescriptions, next checkup, and tips to completed appointments.</p>
        </div>
      </header>

      <section className="dp-card">
        <div className="dp-field">
          <label>Patient</label>
          <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
            {patients.map((patient) => (
              <option key={patient.patientId} value={patient.patientId}>
                {patient.name} ({patient.email})
              </option>
            ))}
          </select>
        </div>

        <div className="dp-field">
          <label>Completed Appointment</label>
          <select
            value={selectedAppointmentId}
            onChange={(e) => setSelectedAppointmentId(e.target.value)}
            disabled={completedAppointments.length === 0}
          >
            {completedAppointments.length === 0 ? (
              <option value="">No completed appointments</option>
            ) : (
              completedAppointments.map((appt) => (
                <option key={appt.id} value={appt.id}>
                  #{appt.id} — {appt.appointmentDate} at {appt.appointmentTime}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="dp-grid">
          <div className="dp-field">
            <label>Prescription (text)</label>
            <textarea
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              placeholder="e.g., Amoxicillin 500mg, 1-0-1 after meals for 5 days"
            />
          </div>
          <div className="dp-field">
            <label>Doctor Tip</label>
            <textarea
              value={doctorTip}
              onChange={(e) => setDoctorTip(e.target.value)}
              placeholder="e.g., Drink plenty of water and rest."
            />
          </div>
        </div>

        <div className="dp-grid">
          <div className="dp-field">
            <label>Next Checkup Date</label>
            <input
              type="date"
              value={nextCheckupDate}
              onChange={(e) => setNextCheckupDate(e.target.value)}
            />
          </div>
          <div className="dp-field">
            <label>Doctor Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context for the patient record."
            />
          </div>
        </div>

        {message ? <p className="dp-message">{message}</p> : null}

        <button className="primary-btn" onClick={handleSubmit} disabled={saving || !selectedAppointmentId}>
          {saving ? 'Saving...' : 'Save to Registry'}
        </button>
      </section>

      {pastEntriesForAppointment.length > 0 ? (
        <section className="dp-card">
          <h3>Previous entries for this appointment</h3>
          {pastEntriesForAppointment.map((entry) => (
            <div key={entry.id} className="dp-entry">
              {entry.prescriptions?.length ? (
                <div>
                  <strong>Prescription:</strong>
                  <ul>
                    {entry.prescriptions.map((p) => (
                      <li key={p.id || p.medication}>{p.medication}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {entry.followUpDate ? <p><strong>Next checkup:</strong> {entry.followUpDate}</p> : null}
              {entry.tips?.length ? (
                <p>
                  <strong>Tip:</strong> {entry.tips[0].text}
                </p>
              ) : null}
              {entry.doctorNotes ? <p className="muted">{entry.doctorNotes}</p> : null}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
};

export default DoctorPrescriptions;
