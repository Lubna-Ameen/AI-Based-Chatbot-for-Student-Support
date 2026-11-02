import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaArrowLeft, FaBell, FaCheckCircle, FaInbox } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Style.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";

const formatNotificationDate = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storedStudent = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("studentUser") || "null");
    } catch {
      return null;
    }
  }, []);

  const fetchNotifications = async () => {
    if (!storedStudent?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/student/notifications`, {
        params: { email: storedStudent.email },
        withCredentials: true,
      });
      setNotifications(Array.isArray(response.data?.notifications) ? response.data.notifications : []);
      setError("");
    } catch (fetchError) {
      setNotifications([]);
      setError(fetchError.response?.data?.message || "Unable to load your notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [storedStudent?.email]);

  const markAsRead = async (notificationId) => {
    if (!storedStudent?.email) return;

    try {
      await axios.patch(`${API_BASE}/student/notifications/${notificationId}/read`, {
        email: storedStudent.email,
      }, {
        withCredentials: true,
      });
      setNotifications((current) => current.map((notification) =>
        notification._id === notificationId ? { ...notification, isRead: true, readAt: new Date().toISOString() } : notification
      ));
    } catch (markError) {
      setError(markError.response?.data?.message || "Unable to mark the notification as read.");
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <main className="search-page">
      <Navbar variant="dashboard" />
      <section className="search-dashboard-shell feature-page-shell">
        <button type="button" className="feature-back" onClick={() => navigate("/student/dashboard")}><FaArrowLeft /> Dashboard</button>
        <div className="search-section-heading">
          <h1><FaBell /> Notifications</h1>
          <span>{unreadCount > 0 ? `${unreadCount} unread` : "Student updates"}</span>
        </div>

        {error && <p className="message-box error" role="alert">{error}</p>}

        {loading ? (
          <p className="message-box info">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="search-activity-grid">
            <article className="search-activity-card empty-state-card">
              <span><FaInbox /></span>
              <div>
                <h3>No notifications yet</h3>
                <p>Your academic updates and support request changes will appear here.</p>
              </div>
            </article>
          </div>
        ) : (
          <div className="search-activity-grid">
            {notifications.map((notification) => (
              <article key={notification._id} className={`search-activity-card ${notification.isRead ? "is-read" : "is-unread"}`}>
                <span><FaBell /></span>
                <div>
                  <div className="notification-header-row">
                    <h3>{notification.title || "Student update"}</h3>
                    {!notification.isRead && <span className="notification-status-dot">Unread</span>}
                  </div>
                  <p>{notification.message}</p>
                  {notification.subject && <p className="notification-subject">Request: {notification.subject}</p>}
                  {notification.status && <p className="notification-status">Status: {notification.status}</p>}
                  <div className="notification-meta-row">
                    <small>{formatNotificationDate(notification.createdAt)}</small>
                    {!notification.isRead && (
                      <button type="button" className="notification-mark-read" onClick={() => markAsRead(notification._id)}>
                        <FaCheckCircle /> Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Notifications;
