import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationsPage.css';
import axios from 'axios';



// Local storage helpers (inline so this component can operate without utils)
function readNotificationsLocal() {
  try {
    const raw = localStorage.getItem('notifications');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch  {
    return [];
  }
}



const formatHeading = (text = '') => {
  return text
    .toLowerCase()                 // convert full caps to lowercase
    .replace(/_/g, ' ')            // remove underscores
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize First Letter
};

function writeNotificationsLocal(list) {
  try {
    const unread = list.filter(n => !(n.read === true)).length;
    localStorage.setItem('notifications', JSON.stringify(list));
    localStorage.setItem('unreadNotificationCount', String(unread));
    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { unread } }));
  } catch  {
    // ignore
  }
}

function markAllLocalRead() {
  const list = readNotificationsLocal().map(n => ({ ...n, read: true, unread: false }));
  writeNotificationsLocal(list);
  return list;
}
const NotificationsPage = () => {
  const navigate = useNavigate();

  const role = (localStorage.getItem('role') || 'patient').toLowerCase();

  const dashboardRoute = useMemo(() => {
    if (role === 'doctor') return '/doctor-dashboard';
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'master_admin') return '/master-admin-dashboard';
    return '/patient-dashboard';
  }, [role]);

  const roleLabel = useMemo(() => {
    if (role === 'doctor') return 'Doctor';
    if (role === 'admin') return 'Admin';
    if (role === 'master_admin') return 'Master Admin';
    return 'Patient';
  }, [role]);

  const [notifications, setNotifications] = useState(() => readNotificationsLocal());

useEffect(() => {
  const markAll = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post('/api/notifications/mark-all-read', null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resp = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(resp.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  markAll();
}, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchServer = async () => {
      if (!token) {
        setNotifications(readNotificationsLocal());
        return;
      }

      try {
        const resp = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(resp.data || []);
      } catch  {
        setNotifications(readNotificationsLocal());
      }
    };

    fetchServer();
  }, []);

  const isUnread = (item) => item.readStatus === false;
  // Ensure we always operate on an array (server may return unexpected shape)
  const notificationsList = Array.isArray(notifications) ? notifications : (notifications?.notifications || []);
  const unreadCount = notificationsList.filter((item) => isUnread(item)).length;

  const mapStatus = (item) => {
    const t = (item.type || '').toString().toUpperCase();
    if (t.includes('CANCEL')) return 'canceled';
    if (t.includes('RESCHEDULE')) return 'rescheduled';
    if (t.includes('REQUEST') || t.includes('CREAT') || t.includes('APPROVE')) return 'upcoming';
    return item.status || 'info';
  };

  const criticalCount = notificationsList.filter((item) => mapStatus(item) === 'canceled').length;
  const scheduleCount = notificationsList.filter((item) => ['upcoming', 'rescheduled'].includes(mapStatus(item))).length;

  useEffect(() => {
    localStorage.setItem('unreadNotificationCount', String(unreadCount));
    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { unread: unreadCount } }));
  }, [unreadCount]);

  const handleMarkAllRead = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      const list = markAllLocalRead();
      setNotifications(list);
      return;
    }

    // mark all unread via backend
    (async () => {
      const unread = notifications.filter(n => n.readStatus === false && n.id);
      for (const n of unread) {
        try {
          await axios.post(`/api/notifications/mark-read/${n.id}`, null, { headers: { Authorization: `Bearer ${token}` } });
        } catch  {
          // ignore per-item failure
        }
      }
      // refresh
      try {
        const resp = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(resp.data || []);
      } catch  {
        setNotifications(markAllLocalRead());
      }
    })();
  };

  const handleMarkRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // fallback to local
      const list = notifications.map(n => n.id === id ? { ...n, read: true, unread: false } : n);
      writeNotificationsLocal(list);
      setNotifications(list);
      return;
    }

    try {
      await axios.post(`/api/notifications/mark-read/${id}`, null, { headers: { Authorization: `Bearer ${token}` } });
      const resp = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(resp.data || []);
    } catch  {
      // fallback local update
      const list = notifications.map(n => n.id === id ? { ...n, read: true, unread: false } : n);
      setNotifications(list);
      writeNotificationsLocal(list);
    }
  };

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div className="notifications-heading">
          <h1>Notifications</h1>
          <p>Upcoming appointments, reschedule or cancel updates, and other alerts.</p>
        </div>
        <button type="button" className="back-btn" onClick={() => navigate(dashboardRoute)}>
          Back to Dashboard
        </button>
      </header>

      <section className="notifications-stats">
        <article className="stat-chip">
          <span className="stat-label">New</span>
          <strong>{unreadCount}</strong>
        </article>
        <article className="stat-chip">
          <span className="stat-label">Schedule Updates</span>
          <strong>{scheduleCount}</strong>
        </article>
        <article className="stat-chip critical">
          <span className="stat-label">Critical</span>
          <strong>{criticalCount}</strong>
        </article>
      </section>

      

      <main className="notifications-main">
        {notificationsList.map((item) => {
          const statusClass = mapStatus(item);
          const unread = isUnread(item);
          const timeLabel = item.createdAt ? new Date(item.createdAt).toLocaleString() : (item.time || '');

          return (
            <article key={item.id} className={`notification-card ${statusClass} ${unread ? 'unread' : 'read'}`}>
              <div className="notification-top-row">
                <span className="notification-type">
                  <span className={`notification-dot ${unread ? 'unread' : ''}`} aria-hidden="true" />
                  {formatHeading(item.type || item.title)}
                </span>
                <span className="notification-time">{timeLabel}</span>
              </div>
              <h2>
  {formatHeading(item.type)}
</h2>
              <p>{item.message}</p>
            </article>
          );
        })}
      </main>
    </div>
  );
};

export default NotificationsPage;
