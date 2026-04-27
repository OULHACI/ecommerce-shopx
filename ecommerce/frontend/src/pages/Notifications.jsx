import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(d => { setNotifications(d.notifications); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
  };

  const markAllRead = async () => {
    await api.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
  };

  if (loading) return <div className="loading">Loading...</div>;

  const unread = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="page">
      <div className="notif-header">
        <h1 className="page-title">🔔 Notifications {unread > 0 && <span className="unread-count">{unread}</span>}</h1>
        {unread > 0 && <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="empty-state"><div className="icon">🔔</div><h3>No notifications</h3></div>
      ) : (
        <div className="notif-list">
          {notifications.map(n => (
            <div key={n.id} className={`notif-item card ${n.status === 'unread' ? 'unread' : ''}`} onClick={() => n.status === 'unread' && markRead(n.id)}>
              <div className="notif-dot" style={{ opacity: n.status === 'unread' ? 1 : 0 }} />
              <div className="notif-body">
                <p>{n.message}</p>
                <span>{new Date(n.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
