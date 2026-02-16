import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorPatients.css';

const APPOINTMENTS_KEY = 'patientAppointments';
const REPORTS_KEY = 'patientReports';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [medicineList, setMedicineList] = useState([]);
  const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', duration: '' });
  const [reportFile, setReportFile] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [savedPatients, setSavedPatients] = useState(() => {
    const stored = localStorage.getItem('doctorPatientNotes');
    return stored ? JSON.parse(stored) : {};
  });
  const [patientReports, setPatientReports] = useState(() => {
    const stored = localStorage.getItem(REPORTS_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    setAppointments(stored);
  }, []);

  const uniquePatients = useMemo(() => {
    const patientsMap = {};
    appointments.forEach((apt) => {
      if (!patientsMap[apt.patientName]) {
        patientsMap[apt.patientName] = {
          name: apt.patientName,
          department: apt.department,
          hospital: apt.hospital,
          appointments: []
        };
      }
      patientsMap[apt.patientName].appointments.push(apt);
    });
    return Object.values(patientsMap);
  }, [appointments]);

  useEffect(() => {
    if (selectedPatient && savedPatients[selectedPatient.name]) {
      const saved = savedPatients[selectedPatient.name];
      setNotes(saved.notes || '');
      setPrescription(saved.prescription || '');
      setMedicineList(saved.medicines || []);
    } else {
      setNotes('');
      setPrescription('');
      setMedicineList([]);
    }
  }, [selectedPatient, savedPatients]);

  const handleAddMedicine = () => {
    if (newMedicine.name && newMedicine.dosage && newMedicine.duration) {
      setMedicineList([...medicineList, { ...newMedicine, id: Date.now() }]);
      setNewMedicine({ name: '', dosage: '', duration: '' });
    }
  };

  const handleRemoveMedicine = (id) => {
    setMedicineList(medicineList.filter((m) => m.id !== id));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setReportFile(file);
    } else {
      alert('Please select a PDF file');
      setReportFile(null);
    }
  };

  const handleAddReport = () => {
    if (!reportFile || !reportTitle || !selectedPatient) {
      alert('Please fill all fields');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const patientName = selectedPatient.name;
      const newReport = {
        id: Date.now(),
        title: reportTitle,
        fileName: reportFile.name,
        uploadDate: new Date().toLocaleDateString(),
        base64: e.target.result
      };

      const updated = { ...patientReports };
      if (!updated[patientName]) {
        updated[patientName] = [];
      }
      updated[patientName].push(newReport);

      setPatientReports(updated);
      localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
      setReportFile(null);
      setReportTitle('');
      alert('Report added successfully');
    };
    reader.readAsDataURL(reportFile);
  };

  const handleRemoveReport = (reportId) => {
    if (!selectedPatient) return;
    const patientName = selectedPatient.name;
    const updated = { ...patientReports };
    updated[patientName] = updated[patientName].filter((r) => r.id !== reportId);
    setPatientReports(updated);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
  };

  const getCurrentPatientReports = () => {
    if (!selectedPatient) return [];
    return patientReports[selectedPatient.name] || [];
  };

  const handleDownloadReport = (base64, fileName) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveNotes = () => {
    if (!selectedPatient) return;
    const updated = {
      ...savedPatients,
      [selectedPatient.name]: {
        notes,
        prescription,
        medicines: medicineList
      }
    };
    setSavedPatients(updated);
    localStorage.setItem('doctorPatientNotes', JSON.stringify(updated));
    alert('Notes saved successfully');
  };

  return (
    <div className="doctor-patients-page">
      <header className="patients-header">
        <div>
          <h1>Patient Registry</h1>
          <p>View patient profiles, prescriptions, and consultation notes.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="patients-layout">
        <aside className="patients-list">
          <h2>Patients</h2>
          {uniquePatients.length === 0 ? (
            <p className="empty-message">No patients yet.</p>
          ) : (
            <div className="patient-items">
              {uniquePatients.map((patient) => (
                <button
                  key={patient.name}
                  type="button"
                  className={`patient-card ${selectedPatient?.name === patient.name ? 'active' : ''}`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="patient-initials">{patient.name.split(' ').map((n) => n[0]).join('')}</div>
                  <div>
                    <h4>{patient.name}</h4>
                    <p>{patient.department}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="patient-detail">
          {!selectedPatient ? (
            <div className="empty-state">
              <p>Select a patient from the list to view details.</p>
            </div>
          ) : (
            <>
              <section className="patient-header">
                <div>
                  <h2>{selectedPatient.name}</h2>
                  <p>{selectedPatient.department} • {selectedPatient.hospital}</p>
                </div>
              </section>

              <section className="appointments-section">
                <h3>Appointment History</h3>
                <div className="appointments-list">
                  {selectedPatient.appointments.map((apt) => (
                    <div key={apt.id} className="apt-item">
                      <div>
                        <span>{new Date(apt.date).toLocaleDateString()}</span>
                        <span>{apt.time}</span>
                      </div>
                      <p>{apt.concern}</p>
                      <span className={`status ${apt.status}`}>{apt.status}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="profile-section">
                <h3>Patient Profile</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Age</label>
                    <p>N/A</p>
                  </div>
                  <div className="profile-item">
                    <label>Blood Type</label>
                    <p>N/A</p>
                  </div>
                  <div className="profile-item">
                    <label>Height</label>
                    <p>N/A</p>
                  </div>
                  <div className="profile-item">
                    <label>Weight</label>
                    <p>N/A</p>
                  </div>
                </div>
              </section>

              <section className="reports-section">
                <h3>Medical Reports</h3>
                <div className="report-upload">
                  <input
                    type="text"
                    placeholder="Report title (e.g., Lab Test, X-Ray)"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="report-input"
                  />
                  <label className="file-input-label">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="file-input"
                    />
                    <span className="file-button">{reportFile ? '✓ PDF Selected' : 'Select PDF'}</span>
                  </label>
                  <button type="button" className="primary-btn" onClick={handleAddReport}>
                    Upload Report
                  </button>
                </div>

                {getCurrentPatientReports().length > 0 && (
                  <div className="reports-list">
                    {getCurrentPatientReports().map((report) => (
                      <div key={report.id} className="report-item">
                        <div className="report-info">
                          <div>
                            <strong>{report.title}</strong>
                            <p>{report.fileName}</p>
                            <span className="report-date">{report.uploadDate}</span>
                          </div>
                        </div>
                        <div className="report-actions">
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => handleDownloadReport(report.base64, report.fileName)}
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => handleRemoveReport(report.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="notes-section">
                <div>
                  <h3>Consultation Notes</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add consultation notes, observations, and follow-up plans..."
                    rows="4"
                  />
                </div>

                <div>
                  <h3>Prescription Summary</h3>
                  <textarea
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Overall prescription notes and instructions..."
                    rows="3"
                  />
                </div>

                <div>
                  <h3>Medicines</h3>
                  <div className="medicine-form">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 500mg)"
                      value={newMedicine.dosage}
                      onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 7 days)"
                      value={newMedicine.duration}
                      onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                    />
                    <button type="button" className="primary-btn" onClick={handleAddMedicine}>
                      Add
                    </button>
                  </div>

                  {medicineList.length > 0 && (
                    <div className="medicine-list">
                      {medicineList.map((med) => (
                        <div key={med.id} className="medicine-item">
                          <div>
                            <strong>{med.name}</strong>
                            <p>{med.dosage} • {med.duration}</p>
                          </div>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => handleRemoveMedicine(med.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" className="primary-btn save-btn" onClick={handleSaveNotes}>
                  Save Notes & Prescription
                </button>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorPatients;

