import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PatientReschedule.css';

const APPOINTMENTS_KEY = 'patientAppointments';

const PatientReschedule = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    setAppointments(stored);
  }, []);

  const appointment = useMemo(
    () => appointments.find((item) => String(item.id) === String(id)),
    [appointments, id]
  );

  useEffect(() => {
    if (appointment) {
      setDate(appointment.date);
      setTime(appointment.time);
    }
  }, [appointment]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!date || !time) {
      return;
    }
    const updated = appointments.map((item) => {
      if (String(item.id) !== String(id)) {
        return item;
      }
      return {
        ...item,
        date,
        time,
        rescheduleNote: note.trim(),
        status: 'pending'
      };
    });
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    navigate('/patient-appointments');
  };

  if (!appointment) {
    return (
      <div className="reschedule-page">
        <div className="reschedule-card">
          <h1>Appointment not found</h1>
          <button className="primary-btn" onClick={() => navigate('/patient-appointments')}>
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reschedule-page">
      <div className="reschedule-card">
        <header>
          <h1>Reschedule Appointment</h1>
          <p>{appointment.doctor} • {appointment.hospital}</p>
        </header>

        <form onSubmit={handleSubmit} className="reschedule-form">
          <div className="form-group">
            <label htmlFor="date">New Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">New Time</label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="note">Reason (optional)</label>
            <textarea
              id="note"
              rows="3"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a short note for the clinic"
            />
          </div>

          <div className="reschedule-actions">
            <button type="button" className="ghost-btn" onClick={() => navigate('/patient-appointments')}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientReschedule;
