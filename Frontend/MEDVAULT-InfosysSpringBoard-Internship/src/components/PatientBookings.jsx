import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PatientBookings.css';

const APPOINTMENTS_KEY = 'patientAppointments';

const hospitals = [
  {
    id: 'citycare',
    name: 'CityCare Hospital',
    doctors: [
      { id: 'dr-kapoor', name: 'Dr. Rhea Kapoor', department: 'Cardiology' },
      { id: 'dr-ali', name: 'Dr. Imran Ali', department: 'Endocrinology' }
    ]
  },
  {
    id: 'greenvalley',
    name: 'Green Valley Clinic',
    doctors: [
      { id: 'dr-menon', name: 'Dr. Kavya Menon', department: 'Nutrition' },
      { id: 'dr-verma', name: 'Dr. Nisha Verma', department: 'General Medicine' }
    ]
  }
];

const baseSlots = ['09:00', '10:30', '12:00', '15:00', '16:30'];

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

const getNextDates = (count = 7) => {
  const today = new Date();
  const dates = [];
  for (let i = 0; i < count; i += 1) {
    const next = new Date(today);
    next.setDate(today.getDate() + i);
    dates.push(next.toISOString().slice(0, 10));
  }
  return dates;
};

const buildSlotsForDoctor = (doctorId) => {
  const dates = getNextDates(10);
  const slotsByDate = {};
  dates.forEach((date, index) => {
    const offset = doctorId.length % 3;
    const start = (index + offset) % 2 === 0 ? 0 : 2;
    slotsByDate[date] = baseSlots.slice(start, start + 3);
  });
  return slotsByDate;
};

const slotsCache = hospitals.reduce((acc, hospital) => {
  hospital.doctors.forEach((doctor) => {
    acc[doctor.id] = buildSlotsForDoctor(doctor.id);
  });
  return acc;
}, {});

const PatientBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [hospitalId, setHospitalId] = useState(hospitals[0].id);
  const [doctorId, setDoctorId] = useState(hospitals[0].doctors[0].id);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [concern, setConcern] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    setAppointments(stored);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'book' || tab === 'all') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const currentHospital = useMemo(
    () => hospitals.find((item) => item.id === hospitalId) || hospitals[0],
    [hospitalId]
  );

  const currentDoctor = useMemo(
    () => currentHospital.doctors.find((item) => item.id === doctorId) || currentHospital.doctors[0],
    [currentHospital, doctorId]
  );

  useEffect(() => {
    if (!currentHospital.doctors.find((item) => item.id === doctorId)) {
      setDoctorId(currentHospital.doctors[0].id);
    }
  }, [currentHospital, doctorId]);

  useEffect(() => {
    setSelectedDate('');
    setSelectedTime('');
  }, [hospitalId, doctorId]);

  const availableDates = useMemo(() => {
    const slots = slotsCache[doctorId] || {};
    return Object.keys(slots).filter((date) => slots[date]?.length);
  }, [doctorId]);

  const availableTimes = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    const slots = slotsCache[doctorId] || {};
    return slots[selectedDate] || [];
  }, [doctorId, selectedDate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/patient-bookings?tab=${tab}`);
  };

  const handleBook = () => {
    if (!hospitalId || !doctorId || !selectedDate || !selectedTime || !concern.trim()) {
      setSuccessMessage('Please complete all fields before booking.');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      patientName: localStorage.getItem('patientName') || 'Rahul Agrawal',
      hospital: currentHospital.name,
      doctor: currentDoctor.name,
      department: currentDoctor.department,
      date: selectedDate,
      time: selectedTime,
      status: 'pending',
      concern: concern.trim()
    };

    const updated = [newAppointment, ...appointments];
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    setAppointments(updated);
    setSelectedDate('');
    setSelectedTime('');
    setConcern('');
    setSuccessMessage('Appointment booked successfully.');
    setActiveTab('all');
    navigate('/patient-bookings?tab=all');
  };

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <div>
          <h1>Appointments</h1>
          <p>Manage your bookings and reserve new slots.</p>
        </div>
        <div className="bookings-header-actions">
          <button className="ghost-btn" onClick={() => navigate('/patient-dashboard')}>
            Back to Dashboard
          </button>
          <button className="ghost-btn" onClick={() => navigate('/patient-appointments')}>
            View All
          </button>
          <button className="primary-btn" onClick={() => handleTabChange('book')}>
            Book Appointment
          </button>
        </div>
      </header>

      <div className="booking-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Appointments
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => handleTabChange('book')}
        >
          Book Appointment
        </button>
      </div>

      {activeTab === 'all' && (
        <section className="bookings-section">
          <h2>All appointments</h2>
          {appointments.length === 0 ? (
            <div className="empty-state">
              <p>No appointments yet. Book your first visit.</p>
              <button className="primary-btn" onClick={() => handleTabChange('book')}>
                Book Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map((item) => (
                <div key={item.id} className="appointment-row">
                  <div>
                    <h3>{item.doctor}</h3>
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
                      onClick={() => navigate(`/patient-reschedule/${item.id}`)}
                    >
                      Reschedule
                    </button>
                  </div>
                  <div className="appointment-note">
                    <span>Concern</span>
                    <p>{item.concern}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'book' && (
        <section className="bookings-section">
          <h2>Book a new appointment</h2>
          <div className="booking-grid">
            <div className="booking-card">
              <label htmlFor="hospital">Select hospital</label>
              <select
                id="hospital"
                value={hospitalId}
                onChange={(event) => setHospitalId(event.target.value)}
              >
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>

              <label htmlFor="doctor">Select doctor</label>
              <select
                id="doctor"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                {currentHospital.doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} ({doctor.department})
                  </option>
                ))}
              </select>

              <div className="calendar-block">
                <h3>Available dates</h3>
                <div className="calendar-grid">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      className={`date-btn ${selectedDate === date ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime('');
                      }}
                    >
                      {formatDateLabel(date)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="time-block">
                <h3>Available time slots</h3>
                {selectedDate ? (
                  <div className="time-grid">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`time-btn ${selectedTime === time ? 'active' : ''}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {formatTimeLabel(time)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted">Select a date to view time slots.</p>
                )}
              </div>
            </div>

            <div className="booking-card">
              <label htmlFor="concern">Describe your concern</label>
              <textarea
                id="concern"
                value={concern}
                onChange={(event) => setConcern(event.target.value)}
                placeholder="e.g., I have a headache and need a consultation."
                rows={6}
              />

              {successMessage && <p className="feedback">{successMessage}</p>}

              <button className="primary-btn" onClick={handleBook}>
                Book Appointment
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default PatientBookings;
