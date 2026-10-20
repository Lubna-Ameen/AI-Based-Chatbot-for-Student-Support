import axios from "axios";
import { useEffect, useState } from "react";
import { FaBars, FaBell, FaSignOutAlt, FaUserGraduate } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../BrandLogo";
import AcademicOverview from "./AcademicOverview";
import AIPrediction from "./AIPrediction";
import OverviewCards from "./OverviewCards";
import ProgressSummary from "./ProgressSummary";
import QuickActions from "./QuickActions";
import Recommendations from "./Recommendations";
import RiskStatus from "./RiskStatus";
import StudentAlerts from "./StudentAlerts";
import StudentProfileSummary from "./StudentProfileSummary";
import StudentSidebar from "./StudentSidebar";
import "./StudentDashboard.css";

const API_BASE = "http://127.0.0.1:3002";
export const displayValue = (value, fallback = "Not available yet") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(" • ") : fallback;
  return String(value).trim() || fallback;
};

const getStoredStudent = () => {
  try { return JSON.parse(localStorage.getItem("studentUser") || "null"); }
  catch { return null; }
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 960);

  useEffect(() => {
    const storedStudent = getStoredStudent();
    if (!storedStudent?.email) { navigate("/login", { replace: true }); return; }

    const fetchStudent = async () => {
      try {
        const response = await axios.get(`${API_BASE}/getUsers`);
        const currentStudent = (Array.isArray(response.data) ? response.data : []).find((entry) =>
          storedStudent._id
            ? String(entry._id) === String(storedStudent._id)
            : entry.email?.toLowerCase() === String(storedStudent.email).toLowerCase()
        );
        if (!currentStudent || currentStudent.role === "admin") { localStorage.removeItem("studentUser"); navigate("/login", { replace: true }); return; }
        setStudent(currentStudent);
        localStorage.setItem("studentUser", JSON.stringify(currentStudent));
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Unable to load your student record.");
      } finally { setLoading(false); }
    };
    fetchStudent();
  }, [navigate]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && setIsSidebarOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const syncSidebarToViewport = () => setIsSidebarOpen(window.innerWidth > 960);
    window.addEventListener("resize", syncSidebarToViewport);
    return () => window.removeEventListener("resize", syncSidebarToViewport);
  }, []);

  const handleLogout = () => { localStorage.removeItem("studentUser"); navigate("/login"); };

  return (
    <main className={`student-dashboard-page ${isSidebarOpen ? "sidebar-open" : ""}`} id="dashboard">
      <StudentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onLogout={handleLogout} />
      <nav className="student-dashboard-navbar">
        <div className="student-navbar-start">
          <button type="button" className="student-menu-button" onClick={() => setIsSidebarOpen((isOpen) => !isOpen)} aria-label="Toggle student portal menu" aria-expanded={isSidebarOpen}><FaBars /></button>
          <button type="button" className="student-brand-button" onClick={() => navigate("/student/dashboard")} aria-label="Go to student dashboard"><BrandLogo variant="full" size="nav" /></button>
        </div>
        <div className="student-navbar-account">
          <Link to="/notifications" className="student-notification-button" aria-label="View notifications"><FaBell /></Link>
          <div className="student-account-avatar">{(student?.name || "S").charAt(0).toUpperCase()}</div>
          <div className="student-account-copy"><strong>{student?.name || "Student"}</strong><span>Student</span></div>
          <button type="button" className="student-logout-button" onClick={handleLogout}><FaSignOutAlt />Logout</button>
        </div>
      </nav>
      <div className="student-dashboard-content">
        <header className="student-welcome-section">
          <div><span className="student-dashboard-badge"><FaUserGraduate />Student Dashboard</span><h1>Welcome back, {student?.name || "Student"}</h1><p>Review your academic details, progress, support status, and latest updates in one place.</p></div>
          <div className="student-welcome-icon" aria-hidden="true"><FaUserGraduate /></div>
          {student && <StudentProfileSummary student={student} displayValue={displayValue} />}
        </header>
        {error && <p className="student-message error" role="alert">{error}</p>}
        {loading ? <p className="student-message">Loading your dashboard...</p> : student ? <>
          <OverviewCards student={student} displayValue={displayValue} />
          <AcademicOverview student={student} displayValue={displayValue} />
          <ProgressSummary student={student} displayValue={displayValue} />
          <div className="student-insights-grid"><RiskStatus student={student} /><AIPrediction student={student} /></div>
          <Recommendations recommendations={student.recommendations} />
          <StudentAlerts alerts={student.alerts} />
          <QuickActions />
        </> : !error && <p className="student-message">Student profile not available.</p>}
      </div>
    </main>
  );
};
export default StudentDashboard;
