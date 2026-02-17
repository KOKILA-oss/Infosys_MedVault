import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PatientRatingsReviews.css';

const REVIEWS_KEY = 'patientDoctorRatings';

const DUMMY_VISITS = [
  {
    id: 'demo-visit-1',
    doctorName: 'Dr. Asha Mehta',
    hospitalName: 'CityCare Hospital',
    appointmentDate: '2026-02-05',
    appointmentTime: '10:30'
  },
  {
    id: 'demo-visit-2',
    doctorName: 'Dr. Rohan Kulkarni',
    hospitalName: 'Green Valley Clinic',
    appointmentDate: '2026-01-28',
    appointmentTime: '16:00'
  }
];

const parseStorage = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const toVisitDateTime = (appointmentDate, appointmentTime) => {
  const date = new Date(`${appointmentDate}T${appointmentTime || '00:00'}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatVisitLabel = (appointmentDate, appointmentTime) => {
  const date = toVisitDateTime(appointmentDate, appointmentTime);
  if (!date) return 'Unknown visit time';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getVisitId = (item, index) => {
  if (item.id !== null && item.id !== undefined) return String(item.id);
  return `visit-${index}-${item.doctorName || 'doctor'}-${item.appointmentDate || 'date'}`;
};

const StarRating = ({ value, onChange, disabled = false }) => {
  return (
    <div className="stars" role="radiogroup" aria-label="Rate doctor">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${value >= star ? 'active' : ''}`}
          onClick={() => onChange(star)}
          disabled={disabled}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const PatientRatingsReviews = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [savedReviews, setSavedReviews] = useState({});
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    const loadVisits = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const existingReviews = parseStorage();
      setSavedReviews(existingReviews);

      let apiAppointments = [];
      if (token) {
        try {
          const response = await axios.get('/api/appointments/patient', {
            headers: { Authorization: `Bearer ${token}` }
          });
          apiAppointments = Array.isArray(response.data) ? response.data : [];
        } catch (error) {
          console.error('Failed to fetch patient appointments for reviews', error);
        }
      }

      const now = new Date();

      const completedApiVisits = apiAppointments
        .map((item, index) => {
          const visitDateTime = toVisitDateTime(item.appointmentDate, item.appointmentTime);
          return {
            id: getVisitId(item, index),
            doctorName: item.doctorName || item.doctor?.name || 'Doctor',
            hospitalName: item.hospitalName || item.hospital || item.doctor?.hospitalName || 'Hospital',
            appointmentDate: item.appointmentDate,
            appointmentTime: item.appointmentTime,
            visitDateTime,
            status: (item.status || '').toUpperCase()
          };
        })
        .filter((item) => item.visitDateTime && item.visitDateTime <= now)
        .filter((item) => item.status !== 'REJECTED');

      const merged = [...DUMMY_VISITS, ...completedApiVisits];
      const uniqueVisits = Object.values(
        merged.reduce((accumulator, item, index) => {
          const id = getVisitId(item, index);
          accumulator[id] = {
            ...item,
            id,
            visitDateTime: item.visitDateTime || toVisitDateTime(item.appointmentDate, item.appointmentTime)
          };
          return accumulator;
        }, {})
      ).sort((a, b) => {
        const timeA = a.visitDateTime ? a.visitDateTime.getTime() : 0;
        const timeB = b.visitDateTime ? b.visitDateTime.getTime() : 0;
        return timeB - timeA;
      });

      const initialDrafts = {};
      uniqueVisits.forEach((visit) => {
        const existing = existingReviews[visit.id];
        initialDrafts[visit.id] = {
          rating: existing?.rating || 0,
          review: existing?.review || ''
        };
      });

      setVisits(uniqueVisits);
      setDrafts(initialDrafts);
      setLoading(false);
    };

    loadVisits();
  }, []);

  const reviewedCount = useMemo(
    () => Object.keys(savedReviews).length,
    [savedReviews]
  );

  const averageRating = useMemo(() => {
    const values = Object.values(savedReviews)
      .map((item) => Number(item?.rating || 0))
      .filter((value) => value > 0);
    if (values.length === 0) return '0.0';
    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  }, [savedReviews]);

  const updateDraft = (visitId, nextValues) => {
    setDrafts((current) => ({
      ...current,
      [visitId]: {
        ...current[visitId],
        ...nextValues
      }
    }));
  };

  const handleSaveReview = (visit) => {
    const draft = drafts[visit.id] || { rating: 0, review: '' };
    if (!draft.rating) return;

    const nextReviews = {
      ...savedReviews,
      [visit.id]: {
        rating: draft.rating,
        review: draft.review.trim(),
        doctorName: visit.doctorName,
        hospitalName: visit.hospitalName,
        visitLabel: formatVisitLabel(visit.appointmentDate, visit.appointmentTime),
        submittedAt: new Date().toISOString()
      }
    };

    setSavedReviews(nextReviews);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(nextReviews));
  };

  return (
    <div className="patient-reviews-page">
      <header className="reviews-header">
        <div>
          <h1>Ratings & Reviews</h1>
          <p>After each visit, rate your doctor and share your experience for that hospital.</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/patient-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <section className="reviews-summary">
        <div className="summary-card">
          <span>Total Reviews</span>
          <strong>{reviewedCount}</strong>
        </div>
        <div className="summary-card">
          <span>Average Rating</span>
          <strong>{averageRating} / 5</strong>
        </div>
      </section>

      <section className="reviews-list">
        {loading ? (
          <div className="review-card">Loading visits...</div>
        ) : visits.length === 0 ? (
          <div className="review-card">No completed visits available yet.</div>
        ) : (
          visits.map((visit) => {
            const draft = drafts[visit.id] || { rating: 0, review: '' };
            const submitted = savedReviews[visit.id];

            return (
              <article className="review-card" key={visit.id}>
                <div className="review-head">
                  <div>
                    <h3>{visit.doctorName}</h3>
                    <p>{visit.hospitalName}</p>
                    <span>{formatVisitLabel(visit.appointmentDate, visit.appointmentTime)}</span>
                  </div>
                  {submitted ? <span className="submitted-pill">Submitted</span> : null}
                </div>

                <StarRating
                  value={Number(draft.rating || 0)}
                  onChange={(rating) => updateDraft(visit.id, { rating })}
                />

                <textarea
                  rows="3"
                  value={draft.review}
                  onChange={(event) => updateDraft(visit.id, { review: event.target.value })}
                  placeholder="Write your review for this doctor and hospital"
                />

                <div className="review-actions">
                  <button
                    className="primary-btn"
                    type="button"
                    disabled={!draft.rating}
                    onClick={() => handleSaveReview(visit)}
                  >
                    {submitted ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default PatientRatingsReviews;
