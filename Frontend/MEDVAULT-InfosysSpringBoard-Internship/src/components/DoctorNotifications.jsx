import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorNotifications.css';

const NOTIFICATIONS_KEY = 'doctorNotifications';

const DoctorNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
    // Generate sample notifications if none exist
    generateDefaultNotifications();
  }, []);

  const loadNotifications = () => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    const notifs = data ? JSON.parse(data) : [];
    setNotifications(notifs.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const generateDefaultNotifications = () => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data || JSON.parse(data).length === 0) {
      const defaultNotifications = [
        {
          id: 1,
          type: 'appointment',
          title: 'New Appointment Booked',
          message: 'Aarav Singh has booked an appointment with you on Feb 18, 2026 at 10:30 AM',
          date: new Date().toISOString(),
          read: false,
          icon: '📅'
        },
        {
          id: 2,
          type: 'appointment',
          title: 'Appointment Reminder',
          message: 'You have an appointment with Meera Patel in 2 hours',
          date: new Date(Date.now() - 60000).toISOString(),
          read: false,
          icon: '🔔'
        },
        {
          id: 3,
          type: 'update',
          title: 'Patient Report Submitted',
          message: 'Nisha Verma has submitted a new medical report for your review',
          date: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          icon: '📋'
        },
        {
          id: 4,
          type: 'update',
          title: 'Schedule Update',
          message: 'Your schedule for next week has been finalized',
          date: new Date(Date.now() - 7200000).toISOString(),
          read: true,
          icon: '📝'
        },
        {
          id: 5,
          type: 'appointment',
          title: 'Appointment Cancelled',
          message: 'Kabir Das has cancelled the appointment scheduled for Feb 17, 2026',
          date: new Date(Date.now() - 10800000).toISOString(),
          read: true,
          icon: '❌'
        },
        {
          id: 6,
          type: 'update',
          title: 'Patient Review Added',
          message: 'Vikram Joshi has left a 5-star review for your consultation',
          date: new Date(Date.now() - 14400000).toISOString(),
          read: true,
          icon: '⭐'
        }
      ];

      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(defaultNotifications));
      setNotifications(defaultNotifications);
    }
  };

  const markAsRead = (id) => {
    const updated = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updated);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  };

  const markAsUnread = (id) => {
    const updated = notifications.map(notif =>
      notif.id === id ? { ...notif, read: false } : notif
    );
    setNotifications(updated);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(notif => notif.id !== id);
    setNotifications(updated);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updated);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  };

  const deleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      setNotifications([]);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with appointments and system updates</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="notifications-controls">
        <div className="filter-tabs">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        <div className="action-buttons">
          {unreadCount > 0 && (
            <button className="secondary-btn" onClick={markAllAsRead}>
              ✓ Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="danger-btn" onClick={deleteAll}>
              🗑️ Clear all
            </button>
          )}
        </div>
      </div>

      <div className="notifications-container">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No {filter !== 'all' ? filter : ''} notifications</p>
            <span className="empty-hint">You're all caught up!</span>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification-card ${notif.read ? 'read' : 'unread'} ${notif.type}`}
              >
                <div className="notification-icon">{notif.icon}</div>

                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notif.title}</h3>
                    <span className="notification-time">{formatTime(notif.date)}</span>
                  </div>
                  <p className="notification-message">{notif.message}</p>
                </div>

                <div className="notification-actions">
                  {!notif.read ? (
                    <button
                      className="action-btn mark-read"
                      onClick={() => markAsRead(notif.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  ) : (
                    <button
                      className="action-btn mark-unread"
                      onClick={() => markAsUnread(notif.id)}
                      title="Mark as unread"
                    >
                      ↩
                    </button>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => deleteNotification(notif.id)}
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorNotifications;
