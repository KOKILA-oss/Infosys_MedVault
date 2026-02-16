import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorReports.css';

const DOCTOR_REPORTS_KEY = 'doctorCreatedReports';
const PATIENT_REPORTS_KEY = 'patientReports';

const DoctorReports = () => {
  const navigate = useNavigate();
  const [doctorReports, setDoctorReports] = useState([]);
  const [patientReports, setPatientReports] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  // Form states
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState('General');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [availablePatients, setAvailablePatients] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load doctor created reports
    const doctorReportsData = localStorage.getItem(DOCTOR_REPORTS_KEY);
    const doctorReportsList = doctorReportsData ? JSON.parse(doctorReportsData) : [];
    setDoctorReports(doctorReportsList);

    // Load patient reports (pending approval)
    const patientReportsData = localStorage.getItem(PATIENT_REPORTS_KEY);
    const patientReportsList = patientReportsData ? JSON.parse(patientReportsData) : [];
    
    // Filter reports that need approval
    const pendingReports = [];
    Object.keys(patientReportsList).forEach(patientName => {
      const reports = patientReportsList[patientName] || [];
      reports.forEach(report => {
        pendingReports.push({
          ...report,
          patientName: patientName,
          approved: report.approved || false
        });
      });
    });
    
    setPatientReports(pendingReports);

    // Get list of patients for dropdown
    const appointmentsData = localStorage.getItem('patientAppointments');
    const appointments = appointmentsData ? JSON.parse(appointmentsData) : [];
    const uniquePatients = [...new Set(appointments.map(apt => apt.patientName))];
    setAvailablePatients(uniquePatients);
  };

  const handleCreateReport = () => {
    if (!reportTitle || !selectedPatient) {
      alert('Please fill in all required fields');
      return;
    }

    const newReport = {
      id: Date.now(),
      title: reportTitle,
      description: reportDescription,
      type: reportType,
      patientName: selectedPatient,
      date: new Date().toISOString(),
      createdBy: 'Doctor'
    };

    const updated = [...doctorReports, newReport];
    setDoctorReports(updated);
    localStorage.setItem(DOCTOR_REPORTS_KEY, JSON.stringify(updated));

    // Clear form
    setReportTitle('');
    setReportDescription('');
    setReportType('General');
    setSelectedPatient('');

    setSuccessMessage('Report created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteReport = (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    const updated = doctorReports.filter(r => r.id !== reportId);
    setDoctorReports(updated);
    localStorage.setItem(DOCTOR_REPORTS_KEY, JSON.stringify(updated));

    setSuccessMessage('Report deleted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleApproveReport = (reportIndex) => {
    const updated = [...patientReports];
    updated[reportIndex].approved = true;
    
    // Update in localStorage
    const patientReportsData = localStorage.getItem(PATIENT_REPORTS_KEY);
    const patientReportsList = patientReportsData ? JSON.parse(patientReportsData) : {};
    
    if (patientReportsList[updated[reportIndex].patientName]) {
      const reportIdx = patientReportsList[updated[reportIndex].patientName].findIndex(
        r => r.id === updated[reportIndex].id
      );
      if (reportIdx !== -1) {
        patientReportsList[updated[reportIndex].patientName][reportIdx].approved = true;
      }
    }
    
    localStorage.setItem(PATIENT_REPORTS_KEY, JSON.stringify(patientReportsList));
    setPatientReports(updated);

    setSuccessMessage('Report approved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRejectReport = (reportIndex) => {
    const updated = patientReports.filter((_, idx) => idx !== reportIndex);
    
    // Remove from localStorage
    const patientReportsData = localStorage.getItem(PATIENT_REPORTS_KEY);
    const patientReportsList = patientReportsData ? JSON.parse(patientReportsData) : {};
    
    const reportToRemove = patientReports[reportIndex];
    if (patientReportsList[reportToRemove.patientName]) {
      patientReportsList[reportToRemove.patientName] = 
        patientReportsList[reportToRemove.patientName].filter(r => r.id !== reportToRemove.id);
    }
    
    localStorage.setItem(PATIENT_REPORTS_KEY, JSON.stringify(patientReportsList));
    setPatientReports(updated);

    setSuccessMessage('Report rejected!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const downloadFile = (base64, filename) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <h1>Reports Management</h1>
          <p>Create and approve medical reports</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          📝 Create Report
        </button>
        <button
          className={`tab-btn ${activeTab === 'approve' ? 'active' : ''}`}
          onClick={() => setActiveTab('approve')}
        >
          ✅ Approve Reports ({patientReports.filter(r => !r.approved).length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          📄 My Reports ({doctorReports.length})
        </button>
      </div>

      {/* Create Report Tab */}
      {activeTab === 'create' && (
        <section className="report-section">
          <h2>Create New Report</h2>
          <form className="report-form" onSubmit={(e) => { e.preventDefault(); handleCreateReport(); }}>
            <div className="form-group">
              <label>Select Patient *</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                required
              >
                <option value="">Choose a patient...</option>
                {availablePatients.map(patient => (
                  <option key={patient} value={patient}>{patient}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Report Title *</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g., Blood Test Results, X-Ray Report"
                  required
                />
              </div>
              <div className="form-group">
                <label>Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option>General</option>
                  <option>Blood Test</option>
                  <option>X-Ray</option>
                  <option>Ultrasound</option>
                  <option>CT Scan</option>
                  <option>Pathology</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Enter report details, findings, recommendations..."
                rows="6"
              ></textarea>
            </div>

            <button type="submit" className="primary-btn">
              Create Report
            </button>
          </form>
        </section>
      )}

      {/* Approve Reports Tab */}
      {activeTab === 'approve' && (
        <section className="report-section">
          <h2>Approve Patient Reports</h2>
          
          {patientReports.length === 0 ? (
            <div className="empty-state">
              <p>No reports available for approval</p>
            </div>
          ) : (
            <div className="reports-grid">
              {patientReports.map((report, index) => (
                <div
                  key={report.id}
                  className={`report-card approval-card ${report.approved ? 'approved' : 'pending'}`}
                >
                  <div className="report-card-header">
                    <div>
                      <h3>{report.title}</h3>
                      <p className="patient-name">{report.patientName}</p>
                    </div>
                    <span className={`report-badge ${report.approved ? 'approved' : 'pending'}`}>
                      {report.approved ? '✓ Approved' : '⏳ Pending'}
                    </span>
                  </div>

                  <div className="report-meta">
                    <span>📅 {new Date(report.uploadDate).toLocaleDateString()}</span>
                    <span>📋 {report.fileName}</span>
                  </div>

                  {!report.approved && (
                    <div className="approval-actions">
                      <button
                        className="primary-btn approve-btn"
                        onClick={() => handleApproveReport(index)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="danger-btn reject-btn"
                        onClick={() => handleRejectReport(index)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {report.base64 && (
                    <button
                      className="secondary-btn download-btn"
                      onClick={() => downloadFile(report.base64, report.fileName)}
                    >
                      📥 Download Report
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* View Created Reports Tab */}
      {activeTab === 'view' && (
        <section className="report-section">
          <h2>My Created Reports</h2>

          {doctorReports.length === 0 ? (
            <div className="empty-state">
              <p>You haven't created any reports yet</p>
            </div>
          ) : (
            <div className="reports-grid">
              {doctorReports.map((report) => (
                <div key={report.id} className="report-card created-card">
                  <div className="report-card-header">
                    <div>
                      <h3>{report.title}</h3>
                      <p className="patient-name">{report.patientName}</p>
                    </div>
                    <span className="report-badge type-badge">{report.type}</span>
                  </div>

                  {report.description && (
                    <p className="report-description">{report.description}</p>
                  )}

                  <div className="report-meta">
                    <span>📅 {new Date(report.date).toLocaleDateString()}</span>
                  </div>

                  <button
                    className="danger-btn delete-btn"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default DoctorReports;
