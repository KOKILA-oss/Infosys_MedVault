import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorAllAppointments.css';

const RESCHEDULE_KEY = 'doctor_reschedule_requests';

const formatDateTime = (date, time) => {
  if (!date || !time) return 'N/A';
  const value = new Date(`${date}T${time}`);
  if (Number.isNaN(value.getTime())) return `${date} ${time}`;
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const DoctorAllAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get('/api/appointments/doctor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data || []);
      } catch (error) {
        console.error('Failed to load appointments', error);
      }
    };

    load();
  }, []);

  const rescheduleMap = useMemo(
    () => JSON.parse(localStorage.getItem(RESCHEDULE_KEY) || '{}'),
    [appointments]
  );

  return (
    <div className="doctor-all-page">
      <header className="all-header">
        <div>
          <h1>All Appointments</h1>
          <p>Complete list of doctor appointments with status and reschedule note.</p>
        </div>
        <div className="all-header-actions">
          <button className="ghost-btn" onClick={() => navigate('/doctor-bookings')}>
            Back to Appointment Management
          </button>
        </div>
      </header>

      <section className="all-table-card">
        <div className="all-table-head">
          <span>Patient</span>
          <span>Schedule</span>
          <span>Status</span>
          <span>Reschedule</span>
          <span>Action</span>
        </div>

        {appointments.length === 0 ? (
          <p className="empty-text">No appointments found.</p>
        ) : (
          appointments.map((item) => {
            const request = rescheduleMap[item.id];
            return (
              <article className="all-row" key={item.id}>
                <div>
                  <h3>{item.patientName || 'Patient'}</h3>
                  <p>{item.reason || 'No reason provided'}</p>
                </div>
                <div>{formatDateTime(item.appointmentDate, item.appointmentTime)}</div>
                <div>
                  <span className={`status-chip ${(item.status || '').toLowerCase()}`}>
                    {item.status || 'N/A'}
                  </span>
                </div>
                <div>
                  {request ? (
                    <span className="reschedule-note">
                      {request.date} {request.time}
                    </span>
                  ) : (
                    <span className="reschedule-note muted">Not requested</span>
                  )}
                </div>
                <div>
                  <button
                    className="primary-btn"
                    onClick={() => navigate(`/doctor-appointments/reschedule?id=${item.id}`)}
                  >
                    Reschedule
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default DoctorAllAppointments;
