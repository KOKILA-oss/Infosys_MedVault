import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './PatientProfile.css';

const createPatientKey = (patient) => {
  const email = (patient.email || '').trim().toLowerCase();
  if (email) return email;
  const name = (patient.username || patient.name || 'patient')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .join('-');
  const phone = (patient.phoneNumber || '').split(' ').join('');
  return `${name}-${phone || 'na'}`;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const openBlobInNewTab = (blob, fileName) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
};

const PatientProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    gender: '',
    bloodGroup: '',
    address: '',
    height: '',
    weight: '',
    sugarLevel: '',
    allergies: '',
    emergencyContact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [reportNote, setReportNote] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorLoadError, setDoctorLoadError] = useState('');
  const [reportUploadStatus, setReportUploadStatus] = useState('');
  const [patientIdentity, setPatientIdentity] = useState({ name: '', email: '', phoneNumber: '' });
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const reportsOnlyMode = activeTab === 'reports';

  const effectivePatientIdentity = useMemo(() => {
    const storedUserName = (localStorage.getItem('userName') || '').trim();
    const storedUserEmail = (localStorage.getItem('userEmail') || '').trim();

    return {
      name: patientIdentity.name || storedUserName || profile.username || profile.name || '',
      email: patientIdentity.email || storedUserEmail || profile.email || '',
      phoneNumber: patientIdentity.phoneNumber || profile.phoneNumber || ''
    };
  }, [patientIdentity, profile]);

  const patientKey = useMemo(() => createPatientKey(effectivePatientIdentity), [effectivePatientIdentity]);

  const loadProfile = () => {
    const stored = localStorage.getItem('medvaultProfile');
    const parsed = stored ? JSON.parse(stored) : {};
    setProfile((prev) => ({
      ...prev,
      email: prev.email || localStorage.getItem('userEmail') || '',
      username: prev.username || localStorage.getItem('userName') || '',
      ...parsed
    }));
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = savedTheme;
    loadProfile();
  }, []);

  useEffect(() => {
    const loadPatientIdentity = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/patient/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setPatientIdentity({
          name: response.data?.user?.name || response.data?.name || '',
          email: response.data?.user?.email || response.data?.email || '',
          phoneNumber: response.data?.phoneNumber || ''
        });
      } catch (error) {
        console.error('Failed to load patient identity for reports', error);
        setPatientIdentity({
          name: (localStorage.getItem('userName') || '').trim(),
          email: (localStorage.getItem('userEmail') || '').trim(),
          phoneNumber: ''
        });
      }
    };

    loadPatientIdentity();
  }, []);

  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get('tab');
    if (queryTab === 'reports') {
      setActiveTab('reports');
      return;
    }
    setActiveTab('profile');
  }, [location.search]);

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/patient/records', {
        headers: { Authorization: `Bearer ${token}` },
        params: { category: 'TEST_REPORT' }
      });

      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load test reports', error);
      setReports([]);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/patient/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setAppointments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to load patient appointments for report upload', error);
        setAppointments([]);
      }
    };

    loadAppointments();
  }, []);

  const reportAppointmentOptions = useMemo(() => {
    return appointments
      .filter((item) => item?.doctorId && String(item.doctorId) === String(selectedDoctor))
      .map((item) => ({
        id: item.id,
        label: `${item.appointmentDate || 'Date'} ${item.appointmentTime || ''} - ${item.reason || 'Appointment'}`
      }));
  }, [appointments, selectedDoctor]);

  const loadDoctors = async () => {
    if (doctorOptions.length > 0 || loadingDoctors) return;

    try {
      setLoadingDoctors(true);
      setDoctorLoadError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/doctors', token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : undefined);
      setDoctorOptions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load doctors for report sharing', error);
      setDoctorOptions([]);
      setDoctorLoadError('Unable to load doctors right now.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDoctorPickerToggle = async () => {
    const nextOpen = !showDoctorPicker;
    setShowDoctorPicker(nextOpen);
    setReportUploadStatus('');
    if (nextOpen) {
      await loadDoctors();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    localStorage.setItem('medvaultProfile', JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleCancel = () => {
    loadProfile();
    setIsEditing(false);
  };

  const displayValue = (value) => value || 'Not set';

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!effectivePatientIdentity.email) {
      setReportUploadStatus('Unable to identify the logged-in patient. Please log in again and retry.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setReportUploadStatus('Please upload only PDF reports.');
      return;
    }
    if (!selectedDoctor) {
      setShowDoctorPicker(true);
      setReportUploadStatus('Select a doctor first, then upload the PDF report.');
      await loadDoctors();
      return;
    }

    const doctor = doctorOptions.find((item) => String(item.id) === selectedDoctor);
    const token = localStorage.getItem('token');

    if (!token) {
      setReportUploadStatus('Please log in again and retry.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('description', reportNote.trim());
    formData.append('category', 'TEST_REPORT');
    formData.append('sharedDoctorId', selectedDoctor);
    if (selectedAppointmentId) {
      formData.append('appointmentId', selectedAppointmentId);
    }

    try {
      await axios.post('/api/patient/records/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (doctor?.id) {
        await axios.post('/api/patient/records/consents', {
          doctorId: doctor.id,
          category: 'TEST_REPORT',
          expiresAt: null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setReportNote('');
      setSelectedDoctor('');
      setSelectedAppointmentId('');
      setShowDoctorPicker(false);
      setReportUploadStatus('Test report uploaded successfully.');
      await loadReports();

      if (doctor?.email || doctor?.name) {
        await axios.post('/api/notifications/report-shared', {
          doctorEmail: doctor?.email || '',
          doctorName: doctor?.name || '',
          fileName: file.name
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        window.dispatchEvent(new Event('notifications:updated'));
      }
    } catch (error) {
      console.error('Failed to upload test report', error);
      setReportUploadStatus(error.response?.data?.message || 'Unable to upload the test report right now.');
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`/api/patient/records/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      openBlobInNewTab(response.data);
    } catch (error) {
      console.error('Failed to open test report', error);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-topbar">
          <div>
            <h1 className="profile-title">Reports</h1>
            <p className="profile-subtitle">Upload and manage your reports</p>
          </div>
          <div className="profile-actions">
            <button type="button" className="secondary-btn" onClick={() => navigate('/patient-dashboard')}>
              Back to Dashboard
            </button>
            {!reportsOnlyMode && activeTab === 'profile' ? (
              isEditing ? (
                <>
                  <button type="button" className="secondary-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="button" className="primary-btn" onClick={handleSave}>
                    Save Profile
                  </button>
                </>
              ) : (
                <button type="button" className="primary-btn" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )
            ) : null}
          </div>
        </div>

        <div className="profile-card">
          {reportsOnlyMode ? null : (
            <div className="profile-tab-row">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                Reports
              </button>
              <button
                type="button"
                className="tab-btn"
                onClick={() => navigate('/patient-bookings?tab=all')}
              >
                Appointments
              </button>
            </div>
          )}

          {activeTab === 'profile' && !reportsOnlyMode ? (
            <>
              <div className="profile-section">
                <h2 className="section-title">Basic Info</h2>
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="profile-label">Full Name</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="username"
                        value={profile.username}
                        onChange={handleChange}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.username)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Email</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.email)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Phone Number</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="tel"
                        name="phoneNumber"
                        value={profile.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.phoneNumber)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="section-title">Health Details</h2>
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="profile-label">Gender</span>
                    {isEditing ? (
                      <select
                        className="profile-input"
                        name="gender"
                        value={profile.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                        <option value="prefer-not">Prefer not to say</option>
                      </select>
                    ) : (
                      <span className="profile-value">{displayValue(profile.gender)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Blood Group</span>
                    {isEditing ? (
                      <select
                        className="profile-input"
                        name="bloodGroup"
                        value={profile.bloodGroup}
                        onChange={handleChange}
                      >
                        <option value="">Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    ) : (
                      <span className="profile-value">{displayValue(profile.bloodGroup)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Height (cm)</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="number"
                        name="height"
                        value={profile.height}
                        onChange={handleChange}
                        min="0"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.height)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Weight (kg)</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="number"
                        name="weight"
                        value={profile.weight}
                        onChange={handleChange}
                        min="0"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.weight)}</span>
                    )}
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Sugar Level (mg/dL)</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="number"
                        name="sugarLevel"
                        value={profile.sugarLevel}
                        onChange={handleChange}
                        min="0"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.sugarLevel)}</span>
                    )}
                  </div>
                  <div className="profile-field full-width">
                    <span className="profile-label">Address</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="address"
                        value={profile.address}
                        onChange={handleChange}
                        placeholder="Street, City, State"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.address)}</span>
                    )}
                  </div>
                  <div className="profile-field full-width">
                    <span className="profile-label">Allergies</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="allergies"
                        value={profile.allergies}
                        onChange={handleChange}
                        placeholder="List any allergies"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.allergies)}</span>
                    )}
                  </div>
                  <div className="profile-field full-width">
                    <span className="profile-label">Emergency Contact</span>
                    {isEditing ? (
                      <input
                        className="profile-input"
                        type="text"
                        name="emergencyContact"
                        value={profile.emergencyContact}
                        onChange={handleChange}
                        placeholder="Name and phone number"
                      />
                    ) : (
                      <span className="profile-value">{displayValue(profile.emergencyContact)}</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="profile-section">
              <h2 className="section-title">Test Reports</h2>
              <p className="profile-subtitle">Upload your PDF test report and choose which doctor can see it.</p>
              <div className="report-upload-row">
                <button type="button" className="picker-btn" onClick={handleDoctorPickerToggle}>
                  {selectedDoctor
                    ? `Submitted to: ${doctorOptions.find((doctor) => String(doctor.id) === selectedDoctor)?.name || 'Selected doctor'}`
                    : 'Visible to / submitted to'}
                </button>
                <label className={`secondary-btn upload-btn ${selectedDoctor ? '' : 'upload-btn-disabled'}`}>
                  {selectedDoctor ? 'Upload PDF' : 'Select doctor first'}
                  {' '}
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={!selectedDoctor} />
                </label>
              </div>
              {showDoctorPicker ? (
                <div className="doctor-picker-panel">
                  <select
                    className="profile-input"
                    value={selectedDoctor}
                    onChange={(event) => {
                      setSelectedDoctor(event.target.value);
                      setSelectedAppointmentId('');
                      setReportUploadStatus('');
                    }}
                  >
                    <option value="">
                      {loadingDoctors ? 'Loading doctors...' : 'Select doctor'}
                    </option>
                    {doctorOptions.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}{doctor.specialization ? ` - ${doctor.specialization}` : ''}{doctor.hospitalName ? ` (${doctor.hospitalName})` : ''}
                      </option>
                    ))}
                  </select>
                  {doctorLoadError ? (
                    <p className="profile-subtitle">{doctorLoadError}</p>
                  ) : null}
                  {!loadingDoctors && doctorOptions.length === 0 ? (
                    <p className="profile-subtitle">No doctors found right now.</p>
                  ) : null}
                </div>
              ) : null}
              <select
                className="profile-input"
                value={selectedAppointmentId}
                onChange={(event) => setSelectedAppointmentId(event.target.value)}
                disabled={!selectedDoctor}
              >
                <option value="">Common report for this doctor (not tied to one appointment)</option>
                {reportAppointmentOptions.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.label}
                  </option>
                ))}
              </select>
              {reportUploadStatus ? <p className="profile-subtitle">{reportUploadStatus}</p> : null}
              <input
                className="profile-input"
                type="text"
                placeholder="Optional note for this report"
                value={reportNote}
                onChange={(event) => setReportNote(event.target.value)}
              />

              <div className="reports-list">
                {reports.length === 0 ? (
                  <p className="profile-value">No reports uploaded yet.</p>
                ) : (
                  reports.map((item) => (
                    <div className="report-item" key={item.id}>
                      <div>
                        <h3>{item.fileName || item.title || 'Report'}</h3>
                        <p>{item.description || 'No note'}</p>
                        {item.sharedDoctorName ? <p>Visible to: {item.sharedDoctorName}</p> : null}
                        {item.appointmentId ? <p>Linked to appointment #{item.appointmentId}</p> : <p>Common test report</p>}
                        <small className="report-date">Uploaded: {formatDateTime(item.createdAt)}</small>
                      </div>
                      <div className="report-actions">
                        <button type="button" className="secondary-btn" onClick={() => handleViewReport(item.id)}>
                          View PDF
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
