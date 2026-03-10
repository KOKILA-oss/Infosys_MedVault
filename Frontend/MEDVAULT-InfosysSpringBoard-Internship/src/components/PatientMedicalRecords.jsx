import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PatientMedicalRecords.css';

const CATEGORIES = ['PRESCRIPTION', 'TEST_REPORT', 'DIAGNOSIS', 'OTHER'];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};


const PatientMedicalRecords = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [uploadForm, setUploadForm] = useState({
    file: null,
    title: '',
    description: '',
    category: 'PRESCRIPTION'
  });

  const loadRecords = async (category = categoryFilter) => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (category && category !== 'ALL') {
        params.category = category;
      }
      const response = await axios.get('/api/patient/records', {
        headers: getAuthHeaders(),
        params
      });
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data || 'Failed to load medical records.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  

  const onUpload = async (event) => {
    event.preventDefault();
    if (!uploadForm.file) {
      setError('Please choose a file before upload.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title.trim());
      formData.append('description', uploadForm.description.trim());
      formData.append('category', uploadForm.category);

      await axios.post('/api/patient/records/upload', formData, {
        headers: getAuthHeaders()
      });

      setUploadForm({
        file: null,
        title: '',
        description: '',
        category: 'PRESCRIPTION'
      });
      await loadRecords();
    } catch (err) {
      setError(err.response?.data || 'Upload failed.');
    }
  };

  const onDownload = async (recordId, fileName) => {
    try {
      const response = await axios.get(`/api/patient/records/${recordId}/download`, {
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

  const onDelete = async (recordId) => {
    try {
      await axios.delete(`/api/patient/records/${recordId}`, {
        headers: getAuthHeaders()
      });
      await loadRecords();
    } catch (err) {
      setError(err.response?.data || 'Delete failed.');
    }
  };

  const onQuickEdit = async (record) => {
    const nextTitle = window.prompt('Update title', record.title || '');
    if (nextTitle === null) return;

    const nextDescription = window.prompt('Update description', record.description || '');
    if (nextDescription === null) return;

    const nextCategory = window.prompt(
      `Update category (${CATEGORIES.join(', ')})`,
      record.category || 'OTHER'
    );
    if (nextCategory === null) return;

    const normalizedCategory = nextCategory.trim().toUpperCase();
    if (!CATEGORIES.includes(normalizedCategory)) {
      setError('Invalid category entered.');
      return;
    }

    try {
      await axios.put(
        `/api/patient/records/${record.id}`,
        {
          title: nextTitle,
          description: nextDescription,
          category: normalizedCategory
        },
        { headers: getAuthHeaders() }
      );
      await loadRecords();
    } catch (err) {
      setError(err.response?.data || 'Update failed.');
    }
  };


  
  const visibleRecords = useMemo(() => records, [records]);

  return (
  <div className="patient-records-page">
    <header className="records-header">
      <div>
        <h1>Medical Records Vault</h1>
        <p>Upload, categorize, and securely manage your medical records.</p>
      </div>
      <button className="ghost-btn" onClick={() => navigate('/patient-dashboard')}>
        Back to Dashboard
      </button>
    </header>

    {error ? <div className="error-box">{String(error)}</div> : null}

    {/* Upload Section */}
    <section className="records-card">
      <h2>Upload New Record</h2>
      <form className="records-grid" onSubmit={onUpload}>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={uploadForm.title}
            onChange={(e) =>
              setUploadForm((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />
        </label>

        <label>
          <span>Category</span>
          <select
            value={uploadForm.category}
            onChange={(e) =>
              setUploadForm((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="full-width">
          <span>Description</span>
          <input
            type="text"
            value={uploadForm.description}
            onChange={(e) =>
              setUploadForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Optional"
          />
        </label>

        <label className="full-width">
          <span>File</span>
          <input
            type="file"
            onChange={(e) =>
              setUploadForm((prev) => ({
                ...prev,
                file: e.target.files?.[0] || null
              }))
            }
            required
          />
        </label>

        <button className="primary-btn" type="submit">
          Upload Record
        </button>
      </form>
    </section>

    {/* Records Section */}
    <section className="records-card">
      <div className="section-row">
        <h2>My Records</h2>
        <select
          value={categoryFilter}
          onChange={(e) => {
            const category = e.target.value;
            setCategoryFilter(category);
            loadRecords(category);
          }}
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading records...</p>
      ) : visibleRecords.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <div className="list-stack">
          {visibleRecords.map((record) => (
            <div className="list-row" key={record.id}>
              <div>
                <strong>{record.title}</strong>
                <p>
                  {record.category} | {record.fileName}
                </p>
                <small>{record.description || "No description"}</small>
              </div>

              <div className="row-actions">
                <button
                  className="ghost-btn"
                  onClick={() => onDownload(record.id, record.fileName)}
                >
                  Download
                </button>

                <button
                  className="ghost-btn"
                  onClick={() => onQuickEdit(record)}
                >
                  Edit
                </button>

                <button
                  className="danger-btn"
                  onClick={() => onDelete(record.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  </div>
);
};

export default PatientMedicalRecords;
