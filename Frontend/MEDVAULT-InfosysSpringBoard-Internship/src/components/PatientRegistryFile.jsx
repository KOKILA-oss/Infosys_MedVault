import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PatientRegistryFile.css';

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const resolveAppointmentDateTime = (appointment) => {
  const parsed = new Date(`${appointment?.appointmentDate}T${appointment?.appointmentTime || '00:00'}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const PatientRegistryFile = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [registryEntries, setRegistryEntries] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAppointments([]);
          setRegistryEntries([]);
          return;
        }

        const [appointmentsResponse, entriesResponse] = await Promise.all([
          axios.get('/api/patient/appointments', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/patient/appointments/registry-entries', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setAppointments(Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : []);
        setRegistryEntries(Array.isArray(entriesResponse.data) ? entriesResponse.data : []);
      } catch (error) {
        console.error('Failed to load registry data', error);
        setAppointments([]);
        setRegistryEntries([]);
      }
    };

    loadData();
  }, []);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .map((item) => ({ ...item, dateTime: resolveAppointmentDateTime(item) }))
      .filter((item) => item.dateTime && item.dateTime < now)
      .sort((a, b) => b.dateTime - a.dateTime);
  }, [appointments]);

  const buildRegistryForAppointment = (appointmentId) => {
    const entries = registryEntries.filter((entry) => String(entry.appointmentId) === String(appointmentId));
    const latest = entries[0] || {};
    return {
      diagnosis: latest.diagnosis || '',
      symptoms: latest.symptoms || '',
      vitals: latest.vitals || '',
      doctorNotes: latest.doctorNotes || '',
      followUpDate: latest.followUpDate || '',
      prescriptions: entries.flatMap((entry) => entry.prescriptions || []),
      checkups: entries.flatMap((entry) => entry.checkups || []),
      tips: entries.flatMap((entry) => entry.tips || [])
    };
  };

  return (
    <div className="patient-registry-file-page">
      <header className="patient-registry-header">
        <div>
          <h1>Registry File</h1>
          <p>Clinical review, prescriptions, basic checkups, and doctor tips for each completed appointment.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/patient-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <main className="patient-registry-main">
        {pastAppointments.length === 0 ? (
          <article className="patient-registry-item">
            <p>No past appointments available yet.</p>
          </article>
        ) : (
          pastAppointments.map((appointment) => {
            const details = buildRegistryForAppointment(appointment.id);
            const prescriptions = Array.isArray(details.prescriptions) ? details.prescriptions : [];
            const tips = Array.isArray(details.tips) ? details.tips : [];
            const checkups = Array.isArray(details.checkups) ? details.checkups : [];

            return (
              <article key={appointment.id || `${appointment.appointmentDate}-${appointment.appointmentTime}`} className="patient-registry-item">
                <div className="patient-registry-item-head">
                  <div>
                    <h3>{appointment.doctorName || 'Doctor'}</h3>
                    <p>{appointment.status || 'Completed'}</p>
                  </div>
                  <div className="patient-registry-date">
                    <strong>{formatDateTime(appointment.dateTime)}</strong>
                    <span>{appointment.reason || ''}</span>
                  </div>
                </div>

                <div className="patient-registry-details-grid">
                  <div className="patient-registry-detail-card">
                    <h4>Clinical Review</h4>
                    <p><strong>Diagnosis:</strong> {details.diagnosis || 'Not added'}</p>
                    <p><strong>Symptoms:</strong> {details.symptoms || 'Not added'}</p>
                    <p><strong>Vitals:</strong> {details.vitals || 'Not added'}</p>
                    <p><strong>Doctor Notes:</strong> {details.doctorNotes || 'Not added'}</p>
                    <p><strong>Follow-up:</strong> {details.followUpDate || 'Not set'}</p>
                  </div>

                  <div className="patient-registry-detail-card">
                    <h4>Prescription</h4>
                    {prescriptions.length === 0 ? (
                      <p>No prescription recorded for this visit.</p>
                    ) : (
                      <ul>
                        {prescriptions.map((item) => (
                          <li key={item.id || `${item.medication}-${item.instructions || ''}`}>
                            <strong>{item.medication || 'Medication'}</strong>
                            {item.instructions ? <small>{item.instructions}</small> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="patient-registry-detail-card">
                    <h4>Basic Checkup</h4>
                    {checkups.length === 0 ? (
                      <p>No basic checkup recorded.</p>
                    ) : (
                      <ul>
                        {checkups.map((item) => (
                          <li key={item.id || `${item.measuredAt || ''}-${item.bp || ''}`}>
                            <strong>{formatDateTime(item.measuredAt)}</strong>
                            <span>
                              {item.bp ? ` BP: ${item.bp}` : ''}
                              {item.heartRate ? ` • HR: ${item.heartRate}` : ''}
                              {item.sugarLevel ? ` • Sugar: ${item.sugarLevel}` : ''}
                              {item.weight ? ` • Weight: ${item.weight}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="patient-registry-detail-card full-width">
                    <h4>Doctor Tip</h4>
                    {tips.length === 0 ? (
                      <p>No tip added for this visit.</p>
                    ) : (
                      tips.map((item) => (
                        <p key={item.id || `${item.addedAt || ''}-${item.text || ''}`}>{item.text || ''}</p>
                      ))
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
};

export default PatientRegistryFile;
