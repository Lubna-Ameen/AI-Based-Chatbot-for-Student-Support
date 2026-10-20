import { FaArrowLeft, FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Style.css";

const Notifications = () => {
  const navigate = useNavigate();
  return (
    <main className="search-page">
      <Navbar variant="dashboard" />
      <section className="search-dashboard-shell feature-page-shell">
        <button type="button" className="feature-back" onClick={() => navigate("/student/dashboard")}><FaArrowLeft /> Dashboard</button>
        <div className="search-section-heading"><h1><FaBell /> Notifications</h1><span>Student updates</span></div>
        <div className="search-activity-grid">
          <article className="search-activity-card"><span><FaBell /></span><div><h3>Welcome to Student Support</h3><p>Your academic reminders and support updates will appear here.</p></div></article>
        </div>
      </section>
    </main>
  );
};
export default Notifications;
