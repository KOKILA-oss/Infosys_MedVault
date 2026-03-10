import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./DoctorBookings.css";

const SHOW_DUMMY_APPOINTMENTS = true;
const RESCHEDULE_KEY = "doctor_reschedule_requests";

const formatDateLabel = (dateValue) => {
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
};

const formatTimeLabel = (timeValue) => {
  if (!timeValue) return "";
  const [hours = "0", minutes = "0"] = (timeValue || "").split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  if (!name) return "P";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const ALL_FILTERS = {
  TODAY: "today",
  NEXT_FIVE_DAYS: "next-five-days",
  CHOOSE_DATE: "choose-date",
};

const toDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseAppointmentDateTime = (item) => {
  if (!item?.appointmentDate) return null;
  const dateTime = new Date(`${item.appointmentDate}T${item.appointmentTime || "00:00"}`);
  if (!Number.isNaN(dateTime.getTime())) return dateTime;
  const fallbackDate = new Date(item.appointmentDate);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

const formatDateTime = (date, time) => {
  if (!date || !time) return "N/A";
  const value = new Date(`${date}T${time}`);
  if (Number.isNaN(value.getTime())) return `${date} ${time}`;
  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const buildRegistryPatientQuery = (item) => {
  const params = new URLSearchParams();
  params.set("openWindow", "1");
  params.set("focus", "checkup");
  if (item.id !== undefined && item.id !== null) {
    params.set("appointmentId", String(item.id));
  }
  params.set("patientName", item.patientName || item.patient?.name || item.patient?.fullName || "Patient");
  params.set("patientEmail", item.patientEmail || item.patient?.email || "");
  params.set("patientPhone", item.patientPhone || item.patient?.phoneNumber || item.patient?.phone || "");
  return params.toString();
};

const toIsoDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const dummyAppointments = [
  {
    id: 9101,
    patientName: "Rahul Sharma",
    patientEmail: "rahul.sharma@demo.com",
    patientPhone: "+91 98765 43210",
    appointmentDate: toIsoDate(0),
    appointmentTime: "09:30",
    status: "PENDING",
    reason: "Seasonal allergy follow-up",
    hospital: "CityCare Hospital",
  },
  {
    id: 9102,
    patientName: "Meera Nair",
    patientEmail: "meera.nair@demo.com",
    patientPhone: "+91 97654 32109",
    appointmentDate: toIsoDate(1),
    appointmentTime: "11:00",
    status: "APPROVED",
    reason: "Routine annual checkup",
    hospital: "Green Valley Clinic",
  },
  {
    id: 9103,
    patientName: "Aman Verma",
    patientEmail: "aman.verma@demo.com",
    patientPhone: "+91 98989 12121",
    appointmentDate: toIsoDate(-1),
    appointmentTime: "16:15",
    status: "COMPLETED",
    reason: "Blood sugar review",
    hospital: "CityCare Hospital",
  },
  {
    id: 9104,
    patientName: "Kavya Iyer",
    patientEmail: "kavya.iyer@demo.com",
    patientPhone: "+91 98111 22334",
    appointmentDate: toIsoDate(2),
    appointmentTime: "14:00",
    status: "REJECTED",
    reason: "Requested slot unavailable",
    hospital: "Metro Medical Center",
  },
];

const DoctorBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [appointments, setAppointments] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});
  const [rejectErrors, setRejectErrors] = useState({});
  const [rejectOpen, setRejectOpen] = useState({});
  const [allAppointmentsFilter, setAllAppointmentsFilter] = useState(ALL_FILTERS.TODAY);
  const [allAppointmentsDate, setAllAppointmentsDate] = useState(new Date().toISOString().slice(0, 10));

  const getToken = () => localStorage.getItem("token");

  // ✅ FETCH FROM BACKEND
  const fetchAppointments = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        console.warn("No auth token found");
        setAppointments(SHOW_DUMMY_APPOINTMENTS ? dummyAppointments : []);
        return;
      }
      const response = await axios.get("/api/doctor/appointments", {
        headers: { Authorization: `Bearer ${token}` },
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
      console.error("Error fetching appointments", error);
      setAppointments(SHOW_DUMMY_APPOINTMENTS ? dummyAppointments : []);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const rescheduleMap = useMemo(
    () => JSON.parse(localStorage.getItem(RESCHEDULE_KEY) || "{}"),
    [appointments]
  );

  // TAB CONTROL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
   if (tab === "pending" || tab === "approved" || tab === "completed" || tab === "all") {
      setActiveTab(tab);
    }
  }, [location.search]);

  const pendingAppointments = useMemo(
    () => appointments.filter((item) => item.status === "PENDING"),
    [appointments]
  );

  const approvedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "APPROVED"),
    [appointments]
  );

  const rejectedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "REJECTED"),
    [appointments]
  );

  const handleComplete = async (id) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No auth token");

    await axios.put(
      `/api/doctor/appointments/${id}/status`,
      { status: "COMPLETED" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await fetchAppointments();
  } catch (error) {
    console.error("Complete failed", error);
  }
};

  const analytics = useMemo(() => {
    const upcoming = approvedAppointments
      .map((item) => {
        let dateTime = null;
        if (item.appointmentDate && item.appointmentTime) {
          const temp = new Date(`${item.appointmentDate}T${item.appointmentTime}`);
          if (!Number.isNaN(temp.getTime())) dateTime = temp;
        }
        return { ...item, dateTime };
      })
      .filter((i) => i.dateTime)
      .sort((a, b) => a.dateTime - b.dateTime);

    return {
      approvedCount: approvedAppointments.length,
      pendingCount: pendingAppointments.length,
      rejectedCount: rejectedAppointments.length,
      nextAppointment: upcoming[0] || null,
    };
  }, [approvedAppointments, pendingAppointments, rejectedAppointments]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/doctor-bookings?tab=${tab}`);
  };

  // ✅ APPROVE (BACKEND CALL)
  const handleApprove = async (id) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");
      await axios.put(
        `/api/doctor/appointments/${id}/status`,
        { status: "APPROVED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchAppointments();
    } catch (error) {
      console.error("Approve failed", error);
    }
  };

  // ✅ REJECT (BACKEND CALL)
  const handleReject = async (id) => {
    const reason = (rejectReasons[id] || "").trim();
    if (!reason) {
      setRejectErrors((prev) => ({ ...prev, [id]: "Please add a reason." }));
      return;
    }

    try {
      const token = getToken();
      if (!token) throw new Error("No auth token");
      await axios.put(
        `/api/doctor/appointments/${id}/status`,
        { status: "REJECTED", reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchAppointments();
      setRejectOpen((prev) => ({ ...prev, [id]: false }));
    } catch (error) {
      console.error("Reject failed", error);
    }
  };

  const handleRejectToggle = (id) => {
    if (!rejectOpen[id]) {
      setRejectOpen((prev) => ({ ...prev, [id]: true }));
      return;
    }
    handleReject(id);
  };

  const completedAppointments = useMemo(
  () => appointments.filter((item) => item.status === "COMPLETED"),
  [appointments]
);

    const filteredAllAppointments = useMemo(() => {
      const now = new Date();
      const today = toDateOnly(now);

      const withDate = appointments
        .map((item) => ({ ...item, appointmentDateTime: parseAppointmentDateTime(item) }))
        .filter((item) => item.appointmentDateTime);

      const filtered = withDate.filter((item) => {
        const slotDate = toDateOnly(item.appointmentDateTime);

        if (allAppointmentsFilter === ALL_FILTERS.TODAY) {
          return slotDate.getTime() === today.getTime();
        }

        if (allAppointmentsFilter === ALL_FILTERS.NEXT_FIVE_DAYS) {
          const endDate = new Date(today);
          endDate.setDate(endDate.getDate() + 4);
          return slotDate >= today && slotDate <= endDate;
        }

        if (allAppointmentsFilter === ALL_FILTERS.CHOOSE_DATE) {
          if (!allAppointmentsDate) return true;
          const chosen = new Date(`${allAppointmentsDate}T00:00:00`);
          if (Number.isNaN(chosen.getTime())) return true;
          return slotDate.getTime() === toDateOnly(chosen).getTime();
        }

        return true;
      });

      return filtered.sort((a, b) => a.appointmentDateTime - b.appointmentDateTime);
    }, [appointments, allAppointmentsFilter, allAppointmentsDate]);

  return (
    <div className="doctor-bookings-page">
      <header className="bookings-header">
        <div>
          <h1>Appointment Management</h1>
          <p>Review, approve, and schedule patient appointments.</p>
        </div>
        <div className="bookings-header-actions">
          <button className="ghost-btn" onClick={() => navigate('/doctor-patient-registry')}>
            Patient Registry
          </button>
          <button className="ghost-btn" onClick={() => navigate('/doctor-appointments/all')}>
            View All Appointments
          </button>
          <button className="primary-btn" onClick={() => navigate('/doctor-appointments/reschedule')}>
            Reschedule Appointment
          </button>
          <button className="ghost-btn" onClick={() => navigate("/doctor-dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="booking-tabs" role="tablist" aria-label="Appointment status filter">
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => handleTabChange("pending")}
        >
          Pending
        </button>
        <button
          className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => handleTabChange("approved")}
        >
          Approved
        </button>
        <button
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => handleTabChange("completed")}
        >
          Completed
        </button>
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => handleTabChange("all")}
        >
          All
        </button>
      </div>

      <section className="analytics-strip">
        <article className="analytics-card">
          <span>Approved</span>
          <h3>{analytics.approvedCount}</h3>
          <p>Confirmed appointments</p>
        </article>
        <article className="analytics-card">
          <span>Pending</span>
          <h3>{analytics.pendingCount}</h3>
          <p>Awaiting decision</p>
        </article>
        <article className="analytics-card">
          <span>Rejected</span>
          <h3>{analytics.rejectedCount}</h3>
          <p>Declined requests</p>
        </article>
        <article className="analytics-card">
          <span>Next Slot</span>
          <h3>
            {analytics.nextAppointment
              ? formatDateLabel(analytics.nextAppointment.appointmentDate)
              : "None"}
          </h3>
          <p>
            {analytics.nextAppointment
              ? formatTimeLabel(analytics.nextAppointment.appointmentTime)
              : "No upcoming approved"}
          </p>
        </article>
      </section>

      {activeTab === "pending" && (
        <section className="bookings-section">
          <h2>Pending Requests</h2>
          {pendingAppointments.length === 0 ? (
            <div className="empty-state">
              <h3>No pending appointments</h3>
              <p className="muted">New booking requests will appear here.</p>
            </div>
          ) : (
            <div className="appointments-list">
              {pendingAppointments.map((item) => (
                <article key={item.id} className="appointment-card pending-card">
                  <div className="appointment-main">
                    <div className="patient-profile">
                      <div className="patient-avatar">{getInitials(item.patientName)}</div>
                      <div>
                        <h3>{item.patientName}</h3>
                        <p>
                          {formatDateLabel(item.appointmentDate)} • {formatTimeLabel(item.appointmentTime)}
                        </p>
                      </div>
                    </div>
                    <div className="appointment-note">
                      <span>Reason</span>
                      <p>{item.reason || "Not provided"}</p>
                    </div>
                    <span className="status-pill pending">Pending</span>
                  </div>

                  <div className="appointment-actions">
                    <div className="action-buttons">
                      <button className="primary-btn" onClick={() => handleApprove(item.id)}>
                        Approve
                      </button>
                      <button className="danger-btn" onClick={() => handleRejectToggle(item.id)}>
                        {rejectOpen[item.id] ? "Confirm Reject" : "Reject"}
                      </button>
                    </div>
                    {rejectOpen[item.id] && (
                      <div className="reject-panel">
                        <label htmlFor={`reject-reason-${item.id}`}>Rejection Reason</label>
                        <textarea
                          id={`reject-reason-${item.id}`}
                          value={rejectReasons[item.id] || ""}
                          onChange={(e) =>
                            setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="Add rejection reason"
                        />
                        {rejectErrors[item.id] && (
                          <div className="feedback error">{rejectErrors[item.id]}</div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "approved" &&
  approvedAppointments.map((item) => (
    <div key={item.id} className="appointment-card">
      <h3>{item.patientName}</h3>
      <p>
        {formatDateLabel(item.appointmentDate)} -{" "}
        {formatTimeLabel(item.appointmentTime)}
      </p>

      <button
        className="complete-btn"
        onClick={() => handleComplete(item.id)}
      >
        Mark as Completed
      </button>
    </div>
  ))}

  {activeTab === "completed" &&
  completedAppointments.map((item) => (
    <div key={item.id} className="appointment-card completed-card">
      <h3>{item.patientName}</h3>
      <p>
        {formatDateLabel(item.appointmentDate)} -{" "}
        {formatTimeLabel(item.appointmentTime)}
      </p>
      <span className="status-badge completed">Completed</span>
    </div>
  ))}

      {activeTab === "all" && (
        <section className="bookings-section">
          <h2>All Appointments</h2>
          <div className="all-appointments-filter-bar">
            <div className="all-appointments-filter-buttons">
              <button
                type="button"
                className={`all-filter-btn ${allAppointmentsFilter === ALL_FILTERS.TODAY ? "active" : ""}`}
                onClick={() => setAllAppointmentsFilter(ALL_FILTERS.TODAY)}
              >
                Today
              </button>
              <button
                type="button"
                className={`all-filter-btn ${allAppointmentsFilter === ALL_FILTERS.NEXT_FIVE_DAYS ? "active" : ""}`}
                onClick={() => setAllAppointmentsFilter(ALL_FILTERS.NEXT_FIVE_DAYS)}
              >
                Next 5 Days
              </button>
              <button
                type="button"
                className={`all-filter-btn ${allAppointmentsFilter === ALL_FILTERS.CHOOSE_DATE ? "active" : ""}`}
                onClick={() => setAllAppointmentsFilter(ALL_FILTERS.CHOOSE_DATE)}
              >
                Choose Date
              </button>
            </div>

            {allAppointmentsFilter === ALL_FILTERS.CHOOSE_DATE ? (
              <label className="all-calendar-filter" htmlFor="doctor-all-appointments-date">
                <span>Date</span>
                <input
                  id="doctor-all-appointments-date"
                  type="date"
                  value={allAppointmentsDate}
                  onChange={(e) => setAllAppointmentsDate(e.target.value)}
                />
              </label>
            ) : null}
          </div>

          {filteredAllAppointments.length === 0 ? (
            <div className="empty-state">
              <h3>No appointments found</h3>
              <p className="muted">Appointments will appear here when patients book slots.</p>
            </div>
          ) : (
            <div className="all-table-card">
              <div className="all-table-head">
                <span>Patient</span>
                <span>Schedule</span>
                <span>Status</span>
                <span>Reschedule</span>
                <span>Action</span>
              </div>

              {filteredAllAppointments.map((item) => {
                const request = rescheduleMap[item.id];
                return (
                  <article className="all-row" key={item.id}>
                    <div>
                      <h3>{item.patientName || "Patient"}</h3>
                      <p>{item.reason || "No reason provided"}</p>
                    </div>
                    <div>{formatDateTime(item.appointmentDate, item.appointmentTime)}</div>
                    <div>
                      <span className={`status-chip ${(item.status || "").toLowerCase()}`}>
                        {item.status || "N/A"}
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
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default DoctorBookings;
