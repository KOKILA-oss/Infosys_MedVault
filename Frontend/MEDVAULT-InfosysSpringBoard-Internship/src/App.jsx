import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import MasterAdminLogin from './components/MasterAdminLogin';
import Otp from './components/Otp';
import ForgetPass from './components/ForgetPass';
import SetPass from './components/SetPass';
import PatientDashboard from './components/PatientDashboard';
import PatientRegistryFile from './components/PatientRegistryFile';
import DoctorDashboard from './components/DoctorDashboard';
import AdminDashboard from './components/AdminDashboard';
import MasterAdminDashboard from './components/MasterAdminDashboard';
import PatientProfile from './components/Profile/PatientProfile';
import DoctorProfile from './components/Profile/DoctorProfile';
import DoctorPrescriptions from './components/DoctorPrescriptions';
import PatientBookings from './components/PatientBookings';
import DoctorBookings from './components/DoctorBookings';
import DoctorAllAppointments from './components/DoctorAllAppointments';
import DoctorSchedule from './components/DoctorSchedule';
import PatientRatingsReviews from './components/PatientRatingsReviews';
import DoctorRescheduleAppointment from './components/DoctorRescheduleAppointment';
import DoctorPatientRegistry from './components/DoctorPatientRegistry';
import AdminManageDoctors from './components/AdminManageDoctors';
import AdminManagePatients from './components/AdminManagePatients';
import NotificationsPage from './components/NotificationsPage';
import PatientMedicalRecords from './components/PatientMedicalRecords';
import DoctorMedicalRecords from './components/DoctorMedicalRecords';
import PatientSettingsPage from './components/PatientSettingsPage';
import './index.css';
import Chatbot from './components/Chatbot';

const RequireRole = ({ roles, element }) => {
  const role = (localStorage.getItem('role') || '').toLowerCase();
  return roles.includes(role) ? element : <Navigate to="/dashboard" replace />;
};

const DashboardGate = () => {
  const role = (localStorage.getItem('role') || '').toLowerCase();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
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
      <AppShell />
    </Router>
  );
}

const AppShell = () => {
  const location = useLocation();
  // Hide chatbot on auth screens (including trailing slashes or nested paths)
  const isAuthScreen = ['/login', '/signup'].some((route) => location.pathname.startsWith(route));
  const shouldShowChatbot = !isAuthScreen;

  return (
    <>
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
        <Route path="/patient-dashboard" element={<RequireRole roles={['patient']} element={<PatientDashboard />} />} />
        <Route path="/patient-registry-file" element={<RequireRole roles={['patient']} element={<PatientRegistryFile />} />} />
        <Route path="/doctor-dashboard" element={<RequireRole roles={['doctor']} element={<DoctorDashboard />} />} />
        <Route path="/doctor-prescriptions" element={<RequireRole roles={['doctor']} element={<DoctorPrescriptions />} />} />
        <Route path="/admin-dashboard" element={<RequireRole roles={['admin']} element={<AdminDashboard />} />} />
        <Route path="/master-admin-dashboard" element={<RequireRole roles={['master_admin']} element={<MasterAdminDashboard />} />} />
        <Route path="/patient-profile" element={<RequireRole roles={['patient']} element={<PatientProfile />} />} />
        <Route path="/doctor-profile" element={<RequireRole roles={['doctor']} element={<DoctorProfile />} />} />
        <Route path="/patient-bookings" element={<RequireRole roles={['patient']} element={<PatientBookings />} />} />
        <Route path="/patient-ratings-reviews" element={<RequireRole roles={['patient']} element={<PatientRatingsReviews />} />} />
        <Route path="/doctor-bookings" element={<RequireRole roles={['doctor']} element={<DoctorBookings />} />} />
        <Route path="/doctor-schedule" element={<RequireRole roles={['doctor']} element={<DoctorSchedule />} />} />
        <Route path="/doctor-reports" element={<RequireRole roles={['doctor']} element={<Navigate to="/doctor-dashboard" replace />} />} />
        <Route path="/doctor-appointments/all" element={<RequireRole roles={['doctor']} element={<DoctorAllAppointments />} />} />
        <Route path="/doctor-appointments/reschedule" element={<RequireRole roles={['doctor']} element={<DoctorRescheduleAppointment />} />} />
        <Route path="/doctor-patient-registry" element={<RequireRole roles={['doctor']} element={<DoctorPatientRegistry />} />} />
        <Route path="/admin-doctors" element={<RequireRole roles={['admin']} element={<AdminManageDoctors />} />} />
        <Route path="/admin-patients" element={<RequireRole roles={['admin']} element={<AdminManagePatients />} />} />
        <Route path="/notifications" element={<RequireRole roles={['patient', 'doctor', 'admin', 'master_admin']} element={<NotificationsPage />} />} />
        <Route path="/patient-settings" element={<RequireRole roles={['patient']} element={<PatientSettingsPage />} />} />
        <Route path="/patient-medical-records" element={<RequireRole roles={['patient']} element={<PatientMedicalRecords />} />} />
        <Route path="/doctor-medical-records" element={<RequireRole roles={['doctor']} element={<DoctorMedicalRecords />} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {shouldShowChatbot ? <Chatbot /> : null}
    </>
  );
};

export default App;
