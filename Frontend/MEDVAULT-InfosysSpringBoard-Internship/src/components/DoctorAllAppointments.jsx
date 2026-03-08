import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorAllAppointments.css';

const RESCHEDULE_KEY = 'doctor_reschedule_requests';
const SHOW_DUMMY_APPOINTMENTS = true;

const DATE_FILTERS = {
  TODAY: 'today',
  NEXT_FIVE_DAYS: 'next-five-days',
  CHOOSE_DATE: 'choose-date'
};

const toDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseAppointmentDateTime = (item) => {
  if (!item?.appointmentDate) return null;
  const dateTime = new Date(`${item.appointmentDate}T${item.appointmentTime || '00:00'}`);
  if (!Number.isNaN(dateTime.getTime())) return dateTime;

  const fallbackDate = new Date(item.appointmentDate);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toIsoDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatLocalDate(date);
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

const buildRegistryPatientQuery = (item) => {
  const params = new URLSearchParams();
  params.set('openWindow', '1');
  params.set('focus', 'checkup');
  if (item.id !== undefined && item.id !== null) {
    params.set('appointmentId', String(item.id));
  }
  params.set('patientName', item.patientName || item.patient?.name || item.patient?.fullName || 'Patient');
  params.set('patientEmail', item.patientEmail || item.patient?.email || '');
  params.set('patientPhone', item.patientPhone || item.patient?.phoneNumber || item.patient?.phone || '');
  return params.toString();
};

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
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.TODAY);
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setAppointments(SHOW_DUMMY_APPOINTMENTS ? dummyAppointments : []);
          return;
        }
        const response = await axios.get('/api/doctor/appointments/doctor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const apiAppointments = Array.isArray(response.data) ? response.data : [];
        setAppointments(
          apiAppointments.length > 0
            ? apiAppointments
            : SHOW_DUMMY_APPOINTMENTS
              ? dummyAppointments
              : []
        );
      } catch (error) {
        console.error('Failed to load appointments', error);
        setAppointments(SHOW_DUMMY_APPOINTMENTS ? dummyAppointments : []);
      }
    };

    load();
  }, []);

  const rescheduleMap = useMemo(
    () => JSON.parse(localStorage.getItem(RESCHEDULE_KEY) || '{}'),
    [appointments]
  );

  const visibleAppointments = useMemo(() => {
    const now = new Date();
    const today = toDateOnly(now);

    const withDate = appointments
      .map((item) => ({ ...item, appointmentDateTime: parseAppointmentDateTime(item) }))
      .filter((item) => item.appointmentDateTime);

    const filtered = withDate.filter((item) => {
      const slotDate = toDateOnly(item.appointmentDateTime);

      if (dateFilter === DATE_FILTERS.TODAY) {
        return slotDate.getTime() === today.getTime();
      }

      if (dateFilter === DATE_FILTERS.NEXT_FIVE_DAYS) {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 4);
        return slotDate >= today && slotDate <= endDate;
      }

      if (dateFilter === DATE_FILTERS.CHOOSE_DATE) {
        if (!selectedDate) return true;
        const chosen = new Date(`${selectedDate}T00:00:00`);
        if (Number.isNaN(chosen.getTime())) return true;
        return slotDate.getTime() === toDateOnly(chosen).getTime();
      }

      return true;
    });

    return filtered.sort((a, b) => a.appointmentDateTime - b.appointmentDateTime);
  }, [appointments, dateFilter, selectedDate]);

  return (
    <div className="doctor-all-page">
      <header className="all-header">
        <div>
          <h1>All Appointments</h1>
          <p>Complete list of doctor appointments with date filters and time-wise sorting.</p>
        </div>
        <div className="all-header-actions">
          <button className="ghost-btn" onClick={() => navigate('/doctor-bookings')}>
            Back to Appointment Management
          </button>
        </div>
      </header>

      <section className="all-filter-bar">
        <div className="all-filter-buttons" role="tablist" aria-label="Filter appointments by date">
          <button
            type="button"
            className={`filter-btn ${dateFilter === DATE_FILTERS.TODAY ? 'active' : ''}`}
            onClick={() => setDateFilter(DATE_FILTERS.TODAY)}
          >
            Today
          </button>
          <button
            type="button"
            className={`filter-btn ${dateFilter === DATE_FILTERS.NEXT_FIVE_DAYS ? 'active' : ''}`}
            onClick={() => setDateFilter(DATE_FILTERS.NEXT_FIVE_DAYS)}
          >
            Next 5 Days
          </button>
          <button
            type="button"
            className={`filter-btn ${dateFilter === DATE_FILTERS.CHOOSE_DATE ? 'active' : ''}`}
            onClick={() => setDateFilter(DATE_FILTERS.CHOOSE_DATE)}
          >
            Choose Date
          </button>
        </div>

        {dateFilter === DATE_FILTERS.CHOOSE_DATE ? (
          <label className="calendar-filter" htmlFor="all-appointments-date-filter">
            <span>Date</span>
            <input
              id="all-appointments-date-filter"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
        ) : null}
      </section>

      <section className="all-table-card">
        <div className="all-table-head">
          <span>Patient</span>
          <span>Schedule</span>
          <span>Status</span>
          <span>Reschedule</span>
          <span>Action</span>
        </div>

        {visibleAppointments.length === 0 ? (
          <p className="empty-text">No appointments found.</p>
        ) : (
          visibleAppointments.map((item) => {
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
                  <div className="all-action-buttons">
                    <button
                      className="ghost-btn"
                      onClick={() =>
                        navigate(`/doctor-patient-registry?${buildRegistryPatientQuery(item)}`)
                      }
                    >
                      Checkup
                    </button>
                    <button
                      className="primary-btn"
                      onClick={() => navigate(`/doctor-appointments/reschedule?id=${item.id}`)}
                    >
                      Reschedule
                    </button>
                  </div>
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
