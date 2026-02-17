import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./DoctorBookings.css";

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

const DoctorBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [appointments, setAppointments] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});
  const [rejectErrors, setRejectErrors] = useState({});
  const [rejectOpen, setRejectOpen] = useState({});

  const getToken = () => localStorage.getItem("token");

  // ✅ FETCH FROM BACKEND
  const fetchAppointments = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        console.warn("No auth token found");
        return;
      }
      const response = await axios.get("/api/appointments/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments", error);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // TAB CONTROL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "pending" || tab === "approved" || tab === "all") {
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
        `/api/appointments/${id}/status`,
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
        `/api/appointments/${id}/status`,
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

      <div className="booking-tabs">
        <button onClick={() => handleTabChange("pending")}>Pending</button>
        <button onClick={() => handleTabChange("approved")}>Approved</button>
        <button onClick={() => handleTabChange("all")}>All</button>
      </div>

      <section className="analytics-strip">
        <div>Approved: {analytics.approvedCount}</div>
        <div>Pending: {analytics.pendingCount}</div>
        <div>Rejected: {analytics.rejectedCount}</div>
        <div>
          Next Slot:{" "}
          {analytics.nextAppointment
            ? formatDateLabel(analytics.nextAppointment.appointmentDate)
            : "None"}
        </div>
      </section>

      {activeTab === "pending" &&
        pendingAppointments.map((item) => (
          <div key={item.id} className="appointment-card">
            <div className="patient-header">
              <div className="avatar">{getInitials(item.patientName)}</div>
              <h3>{item.patientName}</h3>
            </div>
            <p>
              {formatDateLabel(item.appointmentDate)} -{" "}
              {formatTimeLabel(item.appointmentTime)}
            </p>
            <p>{item.reason}</p>

            <button onClick={() => handleApprove(item.id)}>Approve</button>
            <button onClick={() => handleRejectToggle(item.id)}>
              {rejectOpen[item.id] ? "Confirm Reject" : "Reject"}
            </button>
            {rejectOpen[item.id] && (
              <div className="reject-input">
                <textarea
                  value={rejectReasons[item.id] || ""}
                  onChange={(e) =>
                    setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  placeholder="Add rejection reason"
                />
                {rejectErrors[item.id] && (
                  <div className="error">{rejectErrors[item.id]}</div>
                )}
              </div>
            )}
          </div>
        ))}

      {activeTab === "approved" &&
        approvedAppointments.map((item) => (
          <div key={item.id}>
            {item.patientName} - {item.appointmentTime}
          </div>
        ))}

      {activeTab === "all" &&
        appointments.map((item) => (
          <div key={item.id}>
            {item.patientName} - {item.status}
          </div>
        ))}
    </div>
  );
};

export default DoctorBookings;
