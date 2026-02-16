import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './DoctorBookings.css';

const APPOINTMENTS_KEY = 'patientAppointments';
const SAMPLE_SEEDED_KEY = 'doctorPendingSeeded';

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

const getInitials = (name) => {
  if (!name) {
    return 'P';
  }
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const DoctorBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('pending');
  const [appointments, setAppointments] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});
  const [rejectErrors, setRejectErrors] = useState({});
  const [rejectOpen, setRejectOpen] = useState({});

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sample = [
      {
        id: Date.now(),
        patientName: 'Aarav Singh',
        hospital: 'CityCare Hospital',
        doctor: 'Dr. Asha Sharma',
        department: 'Cardiology',
        date: today,
        time: '11:15',
        status: 'pending',
        concern: 'Chest tightness after exercise.'
      },
      {
        id: Date.now() + 1,
        patientName: 'Meera Patel',
        hospital: 'Green Valley Clinic',
        doctor: 'Dr. Asha Sharma',
        department: 'Hypertension',
        date: today,
        time: '12:40',
        status: 'pending',
        concern: 'High blood pressure readings this week.'
      },
      {
        id: Date.now() + 2,
        patientName: 'Kabir Das',
        hospital: 'CityCare Hospital',
        doctor: 'Dr. Asha Sharma',
        department: 'Follow-up',
        date: today,
        time: '15:10',
        status: 'pending',
        concern: 'Need review of recent lab results.'
      }
    ];
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(sample));
    localStorage.setItem(SAMPLE_SEEDED_KEY, 'true');
    setAppointments(sample);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'pending' || tab === 'approved' || tab === 'all') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const pendingAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'pending'),
    [appointments]
  );

  const approvedAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'confirmed'),
    [appointments]
  );

  const rejectedAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'rejected'),
    [appointments]
  );

  const analytics = useMemo(() => {
    const upcoming = approvedAppointments
      .map((item) => ({
        ...item,
        dateTime: new Date(`${item.date}T${item.time}`)
      }))
      .sort((a, b) => a.dateTime - b.dateTime);
    return {
      approvedCount: approvedAppointments.length,
      pendingCount: pendingAppointments.length,
      rejectedCount: rejectedAppointments.length,
      nextAppointment: upcoming[0] || null
    };
  }, [approvedAppointments, pendingAppointments, rejectedAppointments]);

  const scheduleSlots = useMemo(() => {
    return approvedAppointments
      .map((item) => ({
        ...item,
        dateTime: new Date(`${item.date}T${item.time}`)
      }))
      .sort((a, b) => a.dateTime - b.dateTime)
      .slice(0, 6);
  }, [approvedAppointments]);

  const updateAppointments = (updated) => {
    setAppointments(updated);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/doctor-bookings?tab=${tab}`);
  };

  const handleApprove = (id) => {
    const updated = appointments.map((item) =>
      item.id === id
        ? { ...item, status: 'confirmed', rejectionReason: '' }
        : item
    );
    updateAppointments(updated);
  };

  const handleReject = (id) => {
    const reason = (rejectReasons[id] || '').trim();
    if (!reason) {
      setRejectErrors((prev) => ({ ...prev, [id]: 'Please add a reason.' }));
      return;
    }
    const updated = appointments.map((item) =>
      item.id === id
        ? { ...item, status: 'rejected', rejectionReason: reason }
        : item
    );
    updateAppointments(updated);
    setRejectErrors((prev) => ({ ...prev, [id]: '' }));
    setRejectOpen((prev) => ({ ...prev, [id]: false }));
  };

  const handleRejectToggle = (id) => {
    if (!rejectOpen[id]) {
      setRejectOpen((prev) => ({ ...prev, [id]: true }));
      setRejectErrors((prev) => ({ ...prev, [id]: '' }));
      return;
    }
    handleReject(id);
  };

  return (
    <div className="doctor-bookings-page">
      <header className="bookings-header">
        <div>
          <h1>Appointment Management</h1>
          <p>Review, approve, and schedule patient appointments.</p>
        </div>
        <div className="bookings-header-actions">
          <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
            Back to Dashboard
          </button>
          <button className="ghost-btn" onClick={() => navigate('/doctor-appointments')}>
            View All
          </button>
          <button className="primary-btn" onClick={() => handleTabChange('pending')}>
            Pending Requests
          </button>
        </div>
      </header>

      <div className="booking-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          Pending
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => handleTabChange('approved')}
        >
          Approved
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All
        </button>
      </div>

      <section className="analytics-strip">
        <div className="analytics-card">
          <span>Approved</span>
          <h3>{analytics.approvedCount}</h3>
        </div>
        <div className="analytics-card">
          <span>Pending</span>
          <h3>{analytics.pendingCount}</h3>
        </div>
        <div className="analytics-card">
          <span>Rejected</span>
          <h3>{analytics.rejectedCount}</h3>
        </div>
        <div className="analytics-card">
          <span>Next Slot</span>
          <h3>{analytics.nextAppointment ? formatDateLabel(analytics.nextAppointment.date) : 'None'}</h3>
          <p>{analytics.nextAppointment ? formatTimeLabel(analytics.nextAppointment.time) : 'No upcoming'}</p>
        </div>
      </section>

      {activeTab === 'pending' && (
        <section className="bookings-section">
          <h2>Pending appointments</h2>
          {pendingAppointments.length === 0 ? (
            <div className="empty-state">
              <p>No pending appointments.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {pendingAppointments.map((item) => (
                <div key={item.id} className="appointment-card pending-card">
                  <div className="appointment-main">
                    <div className="patient-profile">
                      <div className="patient-avatar" aria-hidden="true">
                        {getInitials(item.patientName || 'Patient')}
                      </div>
                      <div>
                        <h3>{item.patientName || 'Patient'}</h3>
                        <p>{item.department} • {item.hospital}</p>
                      </div>
                    </div>
                    <div className="appointment-meta">
                      <span>{formatDateLabel(item.date)}</span>
                      <span>{formatTimeLabel(item.time)}</span>
                      <span className="status-pill pending">Pending</span>
                    </div>
                  </div>
                  <div className="appointment-note">
                    <span>Concern</span>
                    <p>{item.concern}</p>
                  </div>
                  <div className="appointment-actions">
                    {rejectOpen[item.id] && (
                      <div className="reject-panel">
                        <label htmlFor={`reject-${item.id}`}>Reason for rejection</label>
                        <textarea
                          id={`reject-${item.id}`}
                          rows={3}
                          value={rejectReasons[item.id] || ''}
                          onChange={(event) =>
                            setRejectReasons((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          placeholder="Add a short reason"
                        />
                        {rejectErrors[item.id] && <p className="feedback error">{rejectErrors[item.id]}</p>}
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => setRejectOpen((prev) => ({ ...prev, [item.id]: false }))}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <div className="action-buttons">
                      <button className="primary-btn" onClick={() => handleApprove(item.id)}>
                        Approve
                      </button>
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => navigate(`/doctor-reschedule/${item.id}`)}
                      >
                        Reschedule
                      </button>
                      <button className="danger-btn" onClick={() => handleRejectToggle(item.id)}>
                        {rejectOpen[item.id] ? 'Confirm Reject' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'approved' && (
        <section className="bookings-section">
          <h2>Approved appointments</h2>
          {approvedAppointments.length === 0 ? (
            <div className="empty-state">
              <p>No approved appointments yet.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {approvedAppointments.map((item) => (
                <div key={item.id} className="appointment-row">
                  <div className="patient-profile">
                    <div className="patient-avatar" aria-hidden="true">
                      {getInitials(item.patientName || 'Patient')}
                    </div>
                    <div>
                      <h3>{item.patientName || 'Patient'}</h3>
                      <p>{item.department} • {item.hospital}</p>
                    </div>
                  </div>
                  <div className="appointment-meta">
                    <span>{formatDateLabel(item.date)}</span>
                    <span>{formatTimeLabel(item.time)}</span>
                    <span className="status-pill confirmed">Approved</span>
                  </div>
                  <div className="appointment-note">
                    <span>Concern</span>
                    <p>{item.concern}</p>
                  </div>
                  <div className="appointment-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => navigate(`/doctor-reschedule/${item.id}`)}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="schedule-section">
            <h3>Upcoming schedule</h3>
            <div className="schedule-grid">
              {scheduleSlots.length === 0 ? (
                <p className="muted">No upcoming slots.</p>
              ) : (
                scheduleSlots.map((item) => (
                  <div key={item.id} className="schedule-card">
                    <div>
                      <h4>{formatDateLabel(item.date)}</h4>
                      <p>{formatTimeLabel(item.time)} • {item.patientName || 'Patient'}</p>
                    </div>
                    <span className="status-pill confirmed">Confirmed</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'all' && (
        <section className="bookings-section">
          <h2>All appointments</h2>
          {appointments.length === 0 ? (
            <div className="empty-state">
              <p>No appointments available.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.map((item) => (
                <div key={item.id} className="appointment-row">
                  <div className="patient-profile">
                    <div className="patient-avatar" aria-hidden="true">
                      {getInitials(item.patientName || 'Patient')}
                    </div>
                    <div>
                      <h3>{item.patientName || 'Patient'}</h3>
                      <p>{item.department} • {item.hospital}</p>
                    </div>
                  </div>
                  <div className="appointment-meta">
                    <span>{formatDateLabel(item.date)}</span>
                    <span>{formatTimeLabel(item.time)}</span>
                    <span className={`status-pill ${item.status}`}>{item.status}</span>
                  </div>
                  <div className="appointment-note">
                    <span>Concern</span>
                    <p>{item.concern}</p>
                    {item.status === 'rejected' && item.rejectionReason && (
                      <p className="rejection-text">Reason: {item.rejectionReason}</p>
                    )}
                  </div>
                  <div className="appointment-actions">
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => navigate(`/doctor-reschedule/${item.id}`)}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default DoctorBookings;
