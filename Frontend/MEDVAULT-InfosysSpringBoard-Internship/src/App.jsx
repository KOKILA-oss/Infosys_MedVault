import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import MasterAdminLogin from './components/MasterAdminLogin';
import Otp from './components/Otp';
import ForgetPass from './components/ForgetPass';
import SetPass from './components/SetPass';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import MasterAdminDashboard from './components/MasterAdminDashboard';
import PatientProfile from './components/Profile/PatientProfile';
import DoctorProfile from './components/Profile/DoctorProfile';
import PatientBookings from './components/PatientBookings';
import DoctorBookings from './components/DoctorBookings';
import DoctorAllAppointments from './components/DoctorAllAppointments';
import PatientRatingsReviews from './components/PatientRatingsReviews';
import DoctorRescheduleAppointment from './components/DoctorRescheduleAppointment';
import DoctorPatientRegistry from './components/DoctorPatientRegistry';
import AdminManageDoctors from './components/AdminManageDoctors';
import AdminManagePatients from './components/AdminManagePatients';
import './index.css';

const DashboardGate = () => {
  const role = (localStorage.getItem('role') || '').toLowerCase();
  if (role === 'master_admin') {
    return <Navigate to="/master-admin-dashboard" replace />;
  }
  if (role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
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
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/master-login" element={<MasterAdminLogin />} />
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
        <Route path="/patient-ratings-reviews" element={<PatientRatingsReviews />} />
        <Route path="/doctor-bookings" element={<DoctorBookings />} />
        <Route path="/doctor-appointments/all" element={<DoctorAllAppointments />} />
        <Route path="/doctor-appointments/reschedule" element={<DoctorRescheduleAppointment />} />
        <Route path="/doctor-patient-registry" element={<DoctorPatientRegistry />} />
        <Route path="/admin-doctors" element={<AdminManageDoctors />} />
        <Route path="/admin-patients" element={<AdminManagePatients />} />
        
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;