import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorPatientRegistry.css';

const DoctorReports = () => {
  const navigate = useNavigate();

  return (
    <div className="doctor-registry-page">
      <header className="registry-header">
        <div>
          <h1>Test Reports</h1>
          <p>Patient-shared test reports are available inside each patient's registry entry.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <section className="registry-card">
        <div className="section-header">
          <div>
            <h2>Use Patient Registry</h2>
            <p className="muted">Open a patient in the registry and check the `Test Reports` field there.</p>
          </div>
          <button className="primary-btn" onClick={() => navigate('/doctor-patient-registry')}>
            Open Patient Registry
          </button>
        </div>
      </section>
    </div>
  );
};

export default DoctorReports;
