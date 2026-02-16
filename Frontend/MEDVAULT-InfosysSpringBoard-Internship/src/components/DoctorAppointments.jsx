import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorAppointments.css';

const APPOINTMENTS_KEY = 'patientAppointments';

const formatDateLabel = (dateValue) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
};

const formatTimeLabel = (timeValue) => {
  const [hours, minutes] = timeValue.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    setAppointments(stored);
  }, []);

  const sorted = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const left = new Date(`${a.date}T${a.time}`);
      const right = new Date(`${b.date}T${b.time}`);
      return left - right;
    });
  }, [appointments]);

  return (
    <div className="appointments-page">
      <header className="appointments-header">
        <div>
          <h1>All Appointments</h1>
          <p>Review every appointment and reschedule when required.</p>
        </div>
        <div className="appointments-header-actions">
          <button className="ghost-btn" onClick={() => navigate('/doctor-bookings?tab=all')}>
            Back to Bookings
          </button>
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <p>No appointments available.</p>
        </div>
      ) : (
        <div className="appointments-list">
          {sorted.map((item) => (
            <div key={item.id} className="appointment-row">
              <div>
                <h3>{item.patientName || 'Patient'}</h3>
                <p>{item.department} • {item.hospital}</p>
              </div>
              <div className="appointment-meta">
                <span>{formatDateLabel(item.date)}</span>
                <span>{formatTimeLabel(item.time)}</span>
                <span className={`status-pill ${item.status}`}>{item.status}</span>
              </div>
              <div className="appointment-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => navigate(`/doctor-reschedule/${item.id}`)}
                >
                  Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
