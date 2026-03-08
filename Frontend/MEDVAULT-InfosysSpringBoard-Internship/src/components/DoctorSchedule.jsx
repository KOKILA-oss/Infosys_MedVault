import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorSchedule.css';

const DOCTOR_LEAVE_DATES_KEY = 'doctorLeaveDates';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseStoredLeaveDates = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DOCTOR_LEAVE_DATES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const createPatientKey = (patient) => {
  const email = (patient.email || '').trim().toLowerCase();
  if (email) return email;
  const name = (patient.name || 'patient').trim().toLowerCase().split(' ').filter(Boolean).join('-');
  const phone = (patient.phoneNumber || '').split(' ').join('');
  return `${name}-${phone || 'na'}`;
};

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const [approvedCountByDate, setApprovedCountByDate] = useState({});
  const [allAppointments, setAllAppointments] = useState([]);
  const [leaveDates, setLeaveDates] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientKey, setSelectedPatientKey] = useState('');
  const [scheduleMonth, setScheduleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    setLeaveDates(parseStoredLeaveDates());
  }, []);

  useEffect(() => {
    const loadApprovedCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const resp = await axios.get('/api/doctor/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = Array.isArray(resp.data) ? resp.data : [];
        setAllAppointments(data);
        const approvedCounts = data.reduce((acc, item) => {
          if ((item.status || '').toUpperCase() !== 'APPROVED' || !item.appointmentDate) return acc;
          acc[item.appointmentDate] = (acc[item.appointmentDate] || 0) + 1;
          return acc;
        }, {});

        setApprovedCountByDate(approvedCounts);
      } catch (error) {
        console.error('Failed to load schedule appointment counts', error);
        setAllAppointments([]);
      }
    };

    loadApprovedCounts();
  }, []);

  const toggleLeaveDate = (dateKey) => {
    setLeaveDates((prev) => {
      const exists = prev.includes(dateKey);
      const next = exists ? prev.filter((item) => item !== dateKey) : [...prev, dateKey];
      localStorage.setItem(DOCTOR_LEAVE_DATES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const calendarModel = useMemo(() => {
    const year = scheduleMonth.getFullYear();
    const month = scheduleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ type: 'blank', key: `blank-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      cells.push({
        type: 'day',
        key: dateKey,
        day,
        dateKey,
        isBusy: leaveDates.includes(dateKey),
        approvedCount: approvedCountByDate[dateKey] || 0,
        isToday: dateKey === formatDateKey(new Date())
      });
    }

    return {
      monthLabel: scheduleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      cells
    };
  }, [scheduleMonth, leaveDates, approvedCountByDate]);

  const allPatients = useMemo(() => {
    const map = new Map();

    allAppointments.forEach((item) => {
      const name =
        item.patientName ||
        item.patient?.name ||
        item.patient?.fullName ||
        'Patient';
      const email = item.patientEmail || item.patient?.email || '';
      const phoneNumber = item.patientPhone || item.phoneNumber || item.patient?.phoneNumber || '';
      const key = createPatientKey({ name, email, phoneNumber });

      if (!map.has(key)) {
        map.set(key, { key, name, email, phoneNumber });
      }
    });

    return Array.from(map.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [allAppointments]);

  useEffect(() => {
    if (!allPatients.length) {
      setSelectedPatientKey('');
      return;
    }

    setSelectedPatientKey((current) => {
      if (current && allPatients.some((item) => item.key === current)) return current;
      return allPatients[0].key;
    });
  }, [allPatients]);

  const visiblePatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return allPatients;
    return allPatients.filter((item) => `${item.name} ${item.email} ${item.phoneNumber}`.toLowerCase().includes(query));
  }, [allPatients, patientSearch]);

  return (
    <div className="doctor-schedule-page">
      <header className="doctor-schedule-header">
        <div>
          <h1>Schedule</h1>
          <p>Mark leave/busy days and view approved appointments count.</p>
        </div>
        <div className="doctor-schedule-actions">
          <button
            className="ghost-btn"
            onClick={() =>
              setScheduleMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1)
              )
            }
          >
            Previous
          </button>
          <button
            className="ghost-btn"
            onClick={() =>
              setScheduleMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1)
              )
            }
          >
            Next
          </button>
          <button className="primary-btn" onClick={() => navigate('/doctor-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="doctor-schedule-layout">
        <aside className="schedule-sidebar">
          <input
            className="schedule-search"
            type="text"
            placeholder="Search patient"
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.target.value)}
          />

          <div className="schedule-patient-list">
            {visiblePatients.length === 0 ? (
              <p className="schedule-muted">No patients found.</p>
            ) : (
              visiblePatients.map((patient) => (
                <button
                  key={patient.key}
                  type="button"
                  className={`schedule-patient-item ${selectedPatientKey === patient.key ? 'active' : ''}`}
                  onClick={() => setSelectedPatientKey(patient.key)}
                >
                  <strong>{patient.name}</strong>
                  <span>{patient.email || 'No email'}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="calendar-card">
          <div className="calendar-head">
            <h3>{calendarModel.monthLabel}</h3>
            <p>Click a date to toggle busy/day-off</p>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarModel.cells.map((cell) =>
              cell.type === 'blank' ? (
                <div key={cell.key} className="calendar-cell blank" />
              ) : (
                <button
                  key={cell.key}
                  type="button"
                  className={`calendar-cell day ${cell.isBusy ? 'busy' : ''} ${cell.isToday ? 'today' : ''}`}
                  onClick={() => toggleLeaveDate(cell.dateKey)}
                  title={cell.isBusy ? 'Marked as Day Off' : 'Mark as Day Off'}
                >
                  <span className="day-number">{cell.day}</span>
                  <span className="approved-count">{cell.approvedCount}</span>
                  <span className="approved-label">Approved</span>
                </button>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DoctorSchedule;
