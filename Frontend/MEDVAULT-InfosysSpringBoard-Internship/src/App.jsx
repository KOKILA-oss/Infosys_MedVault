import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Otp from './components/Otp';
import ForgetPass from './components/ForgetPass';
import SetPass from './components/SetPass';
import LandingPage from './components/LandingPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import PatientProfile from './components/Profile/PatientProfile';
import DoctorProfile from './components/Profile/DoctorProfile';
import PatientBookings from './components/PatientBookings';
import DoctorBookings from './components/DoctorBookings';
import AdminManageDoctors from './components/AdminManageDoctors';
import AdminManagePatients from './components/AdminManagePatients';
import MasterAdminLogin from './components/MasterAdminLogin';
import MasterAdminDashboard from './components/MasterAdminDashboard';
import PatientAppointments from './components/PatientAppointments';
import PatientReschedule from './components/PatientReschedule';
import DoctorAppointments from './components/DoctorAppointments';
import DoctorReschedule from './components/DoctorReschedule';
import DoctorPatients from './components/DoctorPatients';
import DoctorTodaySchedule from './components/DoctorTodaySchedule';
import DoctorEditSchedule from './components/DoctorEditSchedule';
import DoctorAnalytics from './components/DoctorAnalytics';
import DoctorReports from './components/DoctorReports';
import DoctorNotifications from './components/DoctorNotifications';
import './index.css';

const DashboardGate = () => {
  const role = (localStorage.getItem('role') || '').toLowerCase();
  if (role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  if (role === 'master-admin') {
    return <Navigate to="/master-admin-dashboard" replace />;
  }
  return role === 'doctor'
    ? <Navigate to="/doctor-dashboard" replace />
    : <Navigate to="/patient-dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/master-admin-login" element={<MasterAdminLogin />} />
        <Route path="/otp-verify" element={<Otp />} />
        <Route path="/forgot-password" element={<ForgetPass />} />
        <Route path="/set-password" element={<SetPass />} />
        
        {/* Main Application */}
        <Route path="/dashboard" element={<DashboardGate />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/master-admin-dashboard" element={<MasterAdminDashboard />} />
        <Route path="/patient-profile" element={<PatientProfile />} />
        <Route path="/doctor-profile" element={<DoctorProfile />} />
        <Route path="/patient-bookings" element={<PatientBookings />} />
        <Route path="/doctor-bookings" element={<DoctorBookings />} />
        <Route path="/admin-doctors" element={<AdminManageDoctors />} />
        <Route path="/admin-patients" element={<AdminManagePatients />} />
        <Route path="/patient-appointments" element={<PatientAppointments />} />
        <Route path="/patient-reschedule/:id" element={<PatientReschedule />} />
        <Route path="/doctor-appointments" element={<DoctorAppointments />} />
        <Route path="/doctor-reschedule/:id" element={<DoctorReschedule />} />
        <Route path="/doctor-patients" element={<DoctorPatients />} />
        <Route path="/doctor-today-schedule" element={<DoctorTodaySchedule />} />
        <Route path="/doctor-edit-schedule" element={<DoctorEditSchedule />} />
        <Route path="/doctor-analytics" element={<DoctorAnalytics />} />
        <Route path="/doctor-reports" element={<DoctorReports />} />
        <Route path="/doctor-notifications" element={<DoctorNotifications />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;