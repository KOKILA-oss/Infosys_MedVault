import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorTodaySchedule.css';

const APPOINTMENTS_KEY = 'patientAppointments';

const DoctorTodaySchedule = () => {
  const navigate = useNavigate();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    const today = new Date().toISOString().slice(0, 10);
    const todays = stored
      .filter((item) => item.date === today)
      .map((item) => ({
        ...item,
        dateTime: new Date(`${item.date}T${item.time}`)
      }))
      .sort((a, b) => a.dateTime - b.dateTime);
    setTodayAppointments(todays);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#2ecc71';
      case 'pending':
        return '#f39c12';
      case 'rejected':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const isBooked = todayAppointments.some((apt) => apt.time === timeStr);
        const appointment = todayAppointments.find((apt) => apt.time === timeStr);
        slots.push({
          time: timeStr,
          isBooked,
          appointment
        });
      }
    }
    return slots;
  };

  const handleEditSchedule = () => {
    navigate('/doctor-edit-schedule');
  };

  const timeSlots = getTimeSlots();

  return (
    <div className="today-schedule-page">
      <header className="schedule-header">
        <div>
          <h1>Today's Schedule</h1>
          <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={handleEditSchedule}>
            Edit Schedule
          </button>
          <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="schedule-content">
        <section className="timeline-section">
          <h2>Appointment Timeline</h2>
          <div className="timeline">
            {todayAppointments.length === 0 ? (
              <div className="empty-timeline">
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
              todayAppointments.map((apt) => (
                <div key={apt.id} className="timeline-item">
                  <div className="timeline-time">{apt.time}</div>
                  <div className="timeline-dot" style={{ borderColor: getStatusColor(apt.status) }} />
                  <div className="timeline-content">
                    <h3>{apt.patientName}</h3>
                    <p className="concern">{apt.concern}</p>
                    <p className="hospital">{apt.hospital}</p>
                    <span className={`status ${apt.status}`}>{apt.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="slots-section">
          <h2>All Time Slots</h2>
          <div className="slots-grid">
            {timeSlots.map((slot) => (
              <div
                key={slot.time}
                className={`slot-card ${slot.isBooked ? 'booked' : 'available'}`}
                onClick={() => slot.isBooked && setSelectedSlot(slot)}
              >
                <div className="slot-time">{slot.time}</div>
                {slot.isBooked && slot.appointment && (
                  <div className="slot-patient">
                    <p>{slot.appointment.patientName}</p>
                    <span className={`slot-status ${slot.appointment.status}`}>
                      {slot.appointment.status}
                    </span>
                  </div>
                )}
                {!slot.isBooked && <div className="slot-label">Available</div>}
              </div>
            ))}
          </div>
        </section>

        {selectedSlot && selectedSlot.appointment && (
          <section className="selected-appointment">
            <div className="appointment-detail">
              <div className="detail-header">
                <h2>{selectedSlot.appointment.patientName}</h2>
                <button className="close-btn" onClick={() => setSelectedSlot(null)}>×</button>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Time</label>
                  <p>{selectedSlot.appointment.time}</p>
                </div>
                <div className="detail-item">
                  <label>Hospital</label>
                  <p>{selectedSlot.appointment.hospital}</p>
                </div>
                <div className="detail-item">
                  <label>Department</label>
                  <p>{selectedSlot.appointment.department}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p className={`status ${selectedSlot.appointment.status}`}>
                    {selectedSlot.appointment.status}
                  </p>
                </div>
              </div>
              <div className="detail-section">
                <label>Concern</label>
                <p>{selectedSlot.appointment.concern}</p>
              </div>
              {selectedSlot.appointment.rescheduleNote && (
                <div className="detail-section">
                  <label>Reschedule Note</label>
                  <p>{selectedSlot.appointment.rescheduleNote}</p>
                </div>
              )}
              <div className="detail-actions">
                <button
                  className="primary-btn"
                  onClick={() => navigate('/doctor-bookings')}
                >
                  Manage Appointment
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DoctorTodaySchedule;
