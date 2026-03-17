import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './PatientRatingsReviews.css';

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
  const location = useLocation();
  const appointmentIdParam = new URLSearchParams(location.search).get('appointmentId');

  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [savedReviews, setSavedReviews] = useState({});
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    const loadVisits = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      let existingReviews = {};

      let apiAppointments = [];
      if (token) {
        try {
          // fetch the patient's appointments and filter for completed visits
          const response = await axios.get('/api/patient/appointments', {
            headers: { Authorization: `Bearer ${token}` }
          });
          apiAppointments = Array.isArray(response.data) ? response.data : [];
        } catch (error) {
          console.error('Failed to fetch patient appointments for reviews', error);
        }

        try {
          const feedbackResponse = await axios.get('/api/feedback/mine', {
            headers: { Authorization: `Bearer ${token}` }
          });

          existingReviews = (Array.isArray(feedbackResponse.data) ? feedbackResponse.data : []).reduce((acc, item) => {
            const appointmentId = item?.appointmentId;
            if (appointmentId === null || appointmentId === undefined) return acc;
            acc[String(appointmentId)] = {
              rating: Number(item.rating || 0),
              review: item.comment || '',
              doctorName: item.doctorName || 'Doctor',
              hospitalName: item.hospitalName || 'Hospital',
              visitLabel: item.createdAt || '',
              submittedAt: item.createdAt || ''
            };
            return acc;
          }, {});
        } catch (error) {
          console.error('Failed to fetch saved feedback', error);
        }
      }

      setSavedReviews(existingReviews);

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
        // include visits that are explicitly marked COMPLETED by backend,
        // or that have already occurred according to local time
        .filter((item) => (item.status === 'COMPLETED' || (item.visitDateTime && item.visitDateTime <= now)))
        .filter((item) => item.status !== 'REJECTED');

      let uniqueVisits = Object.values(
        completedApiVisits.reduce((accumulator, item, index) => {
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
      // If an appointmentId is provided in the URL, show only that visit (if present)
      if (appointmentIdParam) {
        uniqueVisits = uniqueVisits.filter((v) => String(v.id) === String(appointmentIdParam));
      }

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
  }, [appointmentIdParam]);

  const reviewedCount = useMemo(
    () => Object.keys(savedReviews).length,
    [savedReviews]
  );

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
    const token = localStorage.getItem('token');
    const draft = drafts[visit.id] || { rating: 0, review: '' };
    if (!draft.rating || !token) return;

    (async () => {
      try {
        await axios.post('/api/feedback', {
          appointmentId: Number(visit.id),
          rating: Number(draft.rating),
          comment: draft.review.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSavedReviews((current) => ({
          ...current,
          [visit.id]: {
            rating: draft.rating,
            review: draft.review.trim(),
            doctorName: visit.doctorName,
            hospitalName: visit.hospitalName,
            visitLabel: formatVisitLabel(visit.appointmentDate, visit.appointmentTime),
            submittedAt: new Date().toISOString()
          }
        }));
      } catch (error) {
        console.error('Failed to submit feedback', error);
      }
    })();
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

                {submitted ? (
                  <>
                    <StarRating value={Number(submitted.rating || 0)} onChange={() => {}} disabled={true} />
                    <p className="submitted-review">{submitted.review || 'No review text provided.'}</p>
                    <div className="review-actions">
                      <span className="submitted-pill">Submitted</span>
                    </div>
                  </>
                ) : (
                  <>
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
                        Submit Review
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default PatientRatingsReviews;
