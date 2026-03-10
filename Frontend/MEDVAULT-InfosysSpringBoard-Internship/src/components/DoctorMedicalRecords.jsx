import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorMedicalRecords.css';

const CATEGORIES = ['ALL', 'PRESCRIPTION', 'TEST_REPORT', 'DIAGNOSIS', 'OTHER'];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const DoctorMedicalRecords = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [category, setCategory] = useState('ALL');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await axios.get('/api/doctor/appointments', {
          headers: getAuthHeaders()
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setAppointments(data);
      } catch (err) {
        setError(err.response?.data || 'Failed to load doctor appointments.');
      }
    };

    loadAppointments();
  }, []);

  useEffect(() => {
    const unique = new Map();
    appointments.forEach((item) => {
      if (!item.patientId) return;
      if (!unique.has(item.patientId)) {
        unique.set(item.patientId, {
          id: item.patientId,
          name: item.patientName || `Patient #${item.patientId}`
        });
      }
    });
    const list = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
    setPatients(list);
    if (!selectedPatientId && list.length > 0) {
      setSelectedPatientId(String(list[0].id));
    }
  }, [appointments, selectedPatientId]);

  const loadPatientRecords = async (patientId, categoryValue) => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError('');
      const params = {};
      if (categoryValue && categoryValue !== 'ALL') {
        params.category = categoryValue;
      }

      const response = await axios.get(`/api/doctor/records/patient/${patientId}`, {
        headers: getAuthHeaders(),
        params
      });

      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const serverError = err.response?.data;
      setError(typeof serverError === 'string' ? serverError : 'Failed to load patient records. Ensure patient consent is active.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientRecords(selectedPatientId, category);
    }
  }, [selectedPatientId, category]);

  const onDownload = async (recordId, fileName) => {
    try {
      const response = await axios.get(`/api/doctor/records/${recordId}/download`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'record';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data || 'Download failed.');
    }
  };

  const selectedPatient = useMemo(
    () => patients.find((item) => String(item.id) === String(selectedPatientId)),
    [patients, selectedPatientId]
  );

  return (
    <div className="doctor-records-page">
      <header className="records-header">
        <div>
          <h1>Patient Medical Records</h1>
          <p>Access patient records based on active patient consent and category permissions.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      {error ? <div className="error-box">{String(error)}</div> : null}

      <section className="records-card controls-card">
        <label>
          <span>Patient</span>
          <select
            value={selectedPatientId}
            onChange={(event) => setSelectedPatientId(event.target.value)}
          >
            {patients.length === 0 ? <option value="">No patients found</option> : null}
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <button
          className="primary-btn"
          onClick={() => loadPatientRecords(selectedPatientId, category)}
          disabled={!selectedPatientId}
        >
          Refresh
        </button>
      </section>

      <section className="records-card">
        <h2>
          {selectedPatient
            ? `Records for ${selectedPatient.name}`
            : 'Records'}
        </h2>

        {loading ? (
          <p>Loading records...</p>
        ) : records.length === 0 ? (
          <p>No accessible records found for this patient/category.</p>
        ) : (
          <div className="list-stack">
            {records.map((record) => (
              <div className="list-row" key={record.id}>
                <div>
                  <strong>{record.title}</strong>
                  <p>{record.category} | {record.fileName}</p>
                  <small>{record.description || 'No description'}</small>
                </div>
                <button className="primary-btn" onClick={() => onDownload(record.id, record.fileName)}>
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DoctorMedicalRecords;
