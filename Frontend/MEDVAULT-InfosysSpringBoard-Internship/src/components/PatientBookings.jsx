import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './PatientBookings.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const formatDateLabel = (dateValue) => {
  const [year, month, day] = String(dateValue).split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
};

const formatDateForApi = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const PatientBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [concern, setConcern] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedDoctor = doctors.find((item) => String(item.id) === String(doctorId)) || null;

  useEffect(() => {
    if (!token) return;

    const loadDoctors = async () => {
      try {
        const resp = await axios.get('/api/doctors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = Array.isArray(resp.data) ? resp.data : [];
        setDoctors(list);
        if (list.length > 0) {
          setDoctorId(String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to load doctors', err);
      }
    };

    loadDoctors();
  }, [token]);

  const fetchAppointments = async () => {
    if (!token) return;

    try {
      const resp = await axios.get('/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'book' || tab === 'all') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (!doctorId || !selectedDate) {
      setAvailableTimes([]);
      setAvailabilityMessage('');
      return;
    }

    const loadAvailability = async () => {
      try {
        const resp = await axios.get('/api/appointments/available', {
          params: {
            doctorId: Number(doctorId),
            date: selectedDate
          },
          headers: { Authorization: `Bearer ${token}` }
        });

        const slots = Array.isArray(resp.data?.availableSlots) ? resp.data.availableSlots : [];
        setAvailableTimes(slots);
        setAvailabilityMessage(resp.data?.unavailableReason || '');

        if (!slots.includes(selectedTime)) {
          setSelectedTime('');
        }
      } catch (err) {
        console.error('Failed to load available slots', err);
        setAvailableTimes([]);
        setAvailabilityMessage(err.response?.data?.message || 'Unable to load available slots right now.');
      }
    };

    loadAvailability();
  }, [doctorId, selectedDate, token]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/patient-bookings?tab=${tab}`);
  };

  const handleBook = async () => {
    if (!doctorId || !selectedDate || !selectedTime || !concern.trim()) {
      setSuccessMessage('Please complete all fields.');
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        '/api/patient/appointments/book',
        {
          doctorId: Number(doctorId),
          date: selectedDate,
          time: selectedTime,
          reason: concern.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Appointment booked successfully (Pending approval).');
      setSelectedTime('');
      setConcern('');
      setSelectedDate('');
      setSelectedDateObj(null);
      fetchAppointments();
      setActiveTab('all');
    } catch (err) {
      setSuccessMessage(err.response?.data?.message || 'Slot may already be booked.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <div>
          <h1>Appointments</h1>
          <p>Manage your bookings and reserve new slots.</p>
        </div>
        <div className="bookings-header-actions">
          <button
            className="ghost-btn"
            onClick={() => navigate('/patient-dashboard')}
          >
            Back to Dashboard
          </button>
          <button
            className="primary-btn"
            onClick={() => handleTabChange('book')}
          >
            Book Appointment
          </button>
        </div>
      </header>

      <div className="booking-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Appointments
        </button>
        <button
          className={`tab-btn ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => handleTabChange('book')}
        >
          Book Appointment
        </button>
      </div>

      {activeTab === 'all' && (
        <section className="bookings-section">
          <h2>All Appointments</h2>

          {appointments.length === 0 ? (
            <p>No appointments yet.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((item) => (
                <div key={item.id} className="appointment-row">
                  <h3>{item.doctorName}</h3>

                  <p>
                    {formatDateLabel(item.appointmentDate)} • {formatTimeLabel(item.appointmentTime)}
                  </p>

                  <span className={`status-pill ${String(item.status || '').toLowerCase()}`}>
                    {item.status}
                  </span>

                  {item.status === 'COMPLETED' && (
                    <button
                      className="rate-btn"
                      onClick={() => navigate(`/patient-ratings-reviews?appointmentId=${item.id}`)}
                    >
                      Rate the Experience
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'book' && (
        <section className="bookings-section">
          <h2>Book a New Appointment</h2>

          <select
            className="doctor-select"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">Select Doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
                {doctor.specialization ? ` • ${doctor.specialization}` : ''}
              </option>
            ))}
          </select>

          {selectedDoctor ? (
            <div className="doctor-rating-card">
              <div>
                <h3>{selectedDoctor.name}</h3>
                <p>
                  {selectedDoctor.specialization || 'General Consultation'}
                  {selectedDoctor.hospitalName ? ` • ${selectedDoctor.hospitalName}` : ''}
                </p>
              </div>
            </div>
          ) : null}

          <DatePicker
            selected={selectedDateObj}
            onChange={(date) => {
              setSelectedDateObj(date);
              setSelectedDate(formatDateForApi(date));
            }}
            minDate={new Date()}
            placeholderText="Select appointment date"
            className="doctor-select"
          />

          <div className="time-grid">
            {availableTimes.length === 0 ? (
              <p className="no-slots">{availabilityMessage || 'No slots available'}</p>
            ) : (
              availableTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`time-btn ${selectedTime === time ? 'active' : ''}`}
                >
                  {formatTimeLabel(time)}
                </button>
              ))
            )}
          </div>

          <textarea
            className="concern-input"
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="Describe your concern"
          />

          {successMessage ? <p className="feedback">{successMessage}</p> : null}

          <button
            className="primary-btn"
            onClick={handleBook}
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </section>
      )}
    </div>
  );
};

export default PatientBookings;
