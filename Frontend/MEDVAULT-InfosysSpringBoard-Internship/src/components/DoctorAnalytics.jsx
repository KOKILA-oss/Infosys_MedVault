import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorAnalytics.css';

const DoctorAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalPatients: 0,
    totalHours: 0,
    monthlyHours: 0,
    reviews: []
  });
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    calculateAnalytics();
  }, []);

  const calculateAnalytics = () => {
    // Get all appointments to count unique patients
    const appointmentsData = localStorage.getItem('patientAppointments');
    const appointments = appointmentsData ? JSON.parse(appointmentsData) : [];
    
    const uniquePatients = new Set();
    appointments.forEach(apt => {
      if (apt.patientName) uniquePatients.add(apt.patientName);
    });

    // Get doctor schedule to calculate hours
    const scheduleData = localStorage.getItem('doctorSchedule');
    const schedule = scheduleData ? JSON.parse(scheduleData) : {};

    let totalHours = 0;
    Object.values(schedule).forEach(day => {
      if (day.isWorking) {
        const [startHour, startMin] = day.startTime.split(':').map(Number);
        const [endHour, endMin] = day.endTime.split(':').map(Number);
        const hours = (endHour + endMin/60) - (startHour + startMin/60);
        totalHours += hours;
      }
    });

    // Get current month hours
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const monthlyHours = (totalHours / 7) * daysInMonth;

    // Get reviews
    const reviewsData = localStorage.getItem('doctorReviews');
    const reviews = reviewsData ? JSON.parse(reviewsData) : [];

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    setAnalytics({
      totalPatients: uniquePatients.size,
      totalHours: totalHours.toFixed(1),
      monthlyHours: monthlyHours.toFixed(1),
      reviews: reviews
    });

    setAverageRating(avgRating);
  };

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>View your practice statistics and patient feedback</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="analytics-grid">
        {/* Total Patients Card */}
        <div className="analytics-card patients-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Patients</h3>
            <p className="card-value">{analytics.totalPatients}</p>
            <span className="card-label">Connected patients</span>
          </div>
        </div>

        {/* Weekly Hours Card */}
        <div className="analytics-card hours-card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <h3>Weekly Hours</h3>
            <p className="card-value">{analytics.totalHours} hrs</p>
            <span className="card-label">Per week average</span>
          </div>
        </div>

        {/* Monthly Hours Card */}
        <div className="analytics-card monthly-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Monthly Hours</h3>
            <p className="card-value">{analytics.monthlyHours} hrs</p>
            <span className="card-label">This month projection</span>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="analytics-card rating-card">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <h3>Average Rating</h3>
            <p className="card-value">{averageRating}</p>
            <span className="card-label">From {analytics.reviews.length} reviews</span>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="reviews-section">
        <h2>Patient Reviews</h2>
        
        {analytics.reviews.length > 0 ? (
          <div className="reviews-list">
            {analytics.reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <div>
                    <h4>{review.patientName}</h4>
                    <div className="review-rating">
                      <span className="stars">{'⭐'.repeat(review.rating)}</span>
                      <span className="rating-text">{review.rating}/5</span>
                    </div>
                  </div>
                  <span className="review-date">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-text">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No reviews yet. Provide great service to earn patient feedback!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DoctorAnalytics;
