import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaBars, FaBell, FaBookReader, FaCheckCircle, FaCompass, FaLightbulb, FaMapMarkedAlt, FaRobot, FaShieldAlt, FaSignOutAlt, FaUserGraduate } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../BrandLogo";
import AcademicOverview from "./AcademicOverview";
import OverviewCards from "./OverviewCards";
import ProgressSummary from "./ProgressSummary";
import QuickActions from "./QuickActions";
import StudentAlerts from "./StudentAlerts";
import StudentAcademicSupport from "./StudentAcademicSupport";
import StudentProfileSummary from "./StudentProfileSummary";
import StudentSidebar from "./StudentSidebar";
import "./StudentDashboard.css";

const API_BASE = "http://localhost:3002";
const campusImageUrl = "https://www.utas.edu.om/portals/2/Images/utas-muscat.jpg";

export const displayValue = (value, fallback = "Not available yet") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(" • ") : fallback;
  return String(value).trim() || fallback;
};

const getStoredStudent = () => {
  try { return JSON.parse(localStorage.getItem("studentUser") || "null"); }
  catch { return null; }
};

const getJourneyStages = (student) => {
  const academicLevel = String(student?.academicLevel || student?.currentAcademicLevel || "").trim().toLowerCase();
  const programName = String(student?.program || "").trim();
  const defaultStages = [
    { id: "entry", label: "Foundation / Entry", detail: "Program entry" },
    { id: "diploma", label: "Diploma", detail: "Core academic foundations" },
    { id: "advanced", label: "Advanced Diploma", detail: "Specialized learning" },
    { id: "bachelor", label: "Bachelor", detail: "Degree progression" },
    { id: "graduation", label: "Graduation", detail: "Final milestone" },
  ];

  if (!academicLevel && !programName) {
    return defaultStages.map((stage, index) => ({ ...stage, status: index === 0 ? "current" : "upcoming" }));
  }

  const normalized = academicLevel
    .replace(/\s+/g, " ")
    .replace(/\./g, "")
    .replace(/academic level/i, "")
    .trim();
  const stageIndexMap = {
    foundation: 0,
    entry: 0,
    diploma: 1,
    advanced: 2,
    advanceddiploma: 2,
    bachelor: 3,
    graduation: 4,
  };
  const currentIndex = stageIndexMap[normalized] ?? (/bachelor|degree/i.test(programName) ? 3 : 0);

  return defaultStages.map((stage, index) => {
    if (index < currentIndex) return { ...stage, status: "completed" };
    if (index === currentIndex) return { ...stage, status: "current" };
    return { ...stage, status: "upcoming" };
  });
};

const AcademicJourneyMap = ({ student }) => {
  const stages = useMemo(() => getJourneyStages(student), [student]);
  const activeStage = stages.find((stage) => stage.status === "current") || stages[0];
  const completionValue = Math.round(
    ((stages.filter((stage) => stage.status === "completed").length + (stages.some((stage) => stage.status === "current") ? 0.5 : 0)) /
      stages.length) *
      100
  );
  const creditsCompleted = student?.completedCredits ?? student?.creditsPassed ?? student?.credits ?? null;
  const totalCredits = student?.totalCredits ?? student?.requiredCredits ?? null;
  const goalText = student?.program ? `Continue your ${student.program} progression with the next academic milestone.` : "Update your academic record to view the next milestone.";

  return (
    <section className="student-dashboard-section student-journey-section" id="academic-journey" aria-labelledby="academic-journey-title">
      <div className="student-section-heading split">
        <div>
          <span className="student-section-kicker">Academic journey</span>
          <h2 id="academic-journey-title">Academic Journey Map</h2>
        </div>
        <div className="student-journey-badge">{completionValue}% mapped</div>
      </div>

      <div className="student-journey-layout">
        <div className="student-journey-timeline" aria-label="Academic progression">
          {stages.map((stage, index) => (
            <div key={stage.id} className={`student-journey-step ${stage.status}`}>
              <div className="student-journey-node">
                {stage.status === "completed" ? <FaCheckCircle /> : <FaMapMarkedAlt />}
              </div>
              <div className="student-journey-copy">
                <span>Milestone {index + 1}</span>
                <strong>{stage.label}</strong>
                <small>{stage.detail}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="student-journey-panel">
          <div className="student-journey-panel-header">
            <span className="student-section-kicker">Current milestone</span>
            <h3>{activeStage.label}</h3>
          </div>
          <div className="student-journey-metrics">
            <div>
              <span>Credits completed</span>
              <strong>{displayValue(creditsCompleted, "Not available yet")}</strong>
            </div>
            <div>
              <span>Credits remaining</span>
              <strong>{displayValue(totalCredits ? Math.max((Number(totalCredits) || 0) - (Number(creditsCompleted) || 0), 0) : null, "Not available yet")}</strong>
            </div>
          </div>
          <div className="student-journey-progress">
            <div className="student-journey-progress-bar" style={{ width: `${completionValue}%` }} />
          </div>
          <p className="student-journey-goal"><FaCompass />{goalText}</p>
        </div>
      </div>
    </section>
  );
};

const AIIntelligenceHub = ({ student }) => {
  const hasPrediction = student?.aiPrediction !== null && student?.aiPrediction !== undefined && String(student.aiPrediction).trim();
  const hasRisk = student?.riskStatus !== null && student?.riskStatus !== undefined && String(student.riskStatus).trim();
  const recommendations = Array.isArray(student?.recommendations) ? student.recommendations.filter(Boolean) : [];

  return (
    <section className="student-dashboard-section student-ai-hub" aria-labelledby="ai-hub-title">
      <div className="student-section-heading split">
        <div>
          <span className="student-section-kicker">AI intelligence hub</span>
          <h2 id="ai-hub-title">AI Intelligence Hub</h2>
        </div>
        <span className="student-ai-badge"><FaLightbulb />Live support</span>
      </div>
      <div className="student-ai-grid">
        <div className="student-ai-grid-main">
          <article className="student-dashboard-section student-insight-card" id="ai-prediction" aria-labelledby="ai-prediction-title">
            <span className="student-card-icon"><FaRobot /></span>
            <div>
              <span className="student-section-kicker">Future ML insight</span>
              <h2 id="ai-prediction-title">AI Prediction</h2>
              {hasPrediction ? (
                <>
                  <strong className="student-insight-value">{student.aiPrediction}</strong>
                  {student?.riskProbability !== undefined && student?.riskProbability !== null && <p>Risk probability: {student.riskProbability}</p>}
                  {Array.isArray(student?.importantFactors) && student.importantFactors.length > 0 && (
                    <ul>{student.importantFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
                  )}
                </>
              ) : (
                <p>AI prediction is not available yet.</p>
              )}
            </div>
          </article>
        </div>
        <div className="student-ai-grid-side">
          <article className="student-dashboard-section student-insight-card" id="risk-status" aria-labelledby="risk-status-title">
            <span className="student-card-icon"><FaShieldAlt /></span>
            <div>
              <span className="student-section-kicker">Academic support</span>
              <h2 id="risk-status-title">Risk Status</h2>
              {hasRisk ? (
                <>
                  <strong className="student-insight-value">{student.riskStatus}</strong>
                  {student?.riskReason && <p>{student.riskReason}</p>}
                </>
              ) : (
                <p>No risk prediction available yet.</p>
              )}
            </div>
          </article>

          <section className="student-dashboard-section" id="recommendations" aria-labelledby="recommendations-title">
            <div className="student-section-heading">
              <span className="student-section-kicker">Personalized guidance</span>
              <h2 id="recommendations-title">Recommendations</h2>
            </div>
            {recommendations.length ? (
              <ul className="student-item-list">
                {recommendations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
            ) : (
              <p className="student-empty-state">No recommendations available yet.</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 960);
  const [photoFailed, setPhotoFailed] = useState(false);

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

  const handleProfileUpdate = async (profileData) => {
    const currentStudent = getStoredStudent();
    if (!currentStudent?.email) {
      throw new Error("Student account is not available");
    }

    const response = await axios.put(`${API_BASE}/student/profile`, {
      email: currentStudent.email,
      name: profileData.name,
      phoneNumber: profileData.phoneNumber,
    }, {
      withCredentials: true,
    });

    const updatedStudent = {
      ...currentStudent,
      ...response.data.user,
      email: currentStudent.email,
      _id: currentStudent._id,
    };

    setStudent(updatedStudent);
    localStorage.setItem("studentUser", JSON.stringify(updatedStudent));
    return response.data;
  };

  useEffect(() => {
    const fetchNotificationCount = async () => {
      const currentStudent = getStoredStudent();
      if (!currentStudent?.email) return;

      try {
        const response = await axios.get(`${API_BASE}/student/notifications`, {
          params: { email: currentStudent.email },
          withCredentials: true,
        });
        const unreadCount = Array.isArray(response.data?.notifications)
          ? response.data.notifications.filter((item) => !item.isRead).length
          : 0;
        setNotificationCount(unreadCount);
      } catch {
        setNotificationCount(0);
      }
    };

    if (student?.email) {
      fetchNotificationCount();
    }
  }, [student?.email]);

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
          <Link to="/notifications" className="student-notification-button" aria-label="View notifications">
            <FaBell />
            {notificationCount > 0 && <span className="student-notification-count">{notificationCount}</span>}
          </Link>
          <div className="student-account-avatar">{(student?.name || "S").charAt(0).toUpperCase()}</div>
          <div className="student-account-copy"><strong>{student?.name || "Student"}</strong><span>Student</span></div>
          <button type="button" className="student-logout-button" onClick={handleLogout}><FaSignOutAlt />Logout</button>
        </div>
      </nav>

      <div className="student-dashboard-content">
        <header className="student-welcome-section">
          <div className="student-welcome-visual" aria-label="UTAS Muscat campus banner">
            {campusImageUrl && !photoFailed ? (
              <img src={campusImageUrl} alt="UTAS Muscat campus" onError={() => setPhotoFailed(true)} />
            ) : (
              <div className="student-campus-banner-note">
                <span>UTAS Muscat campus photo</span>
              </div>
            )}
          </div>

          <div className="student-welcome-copy">
            <span className="student-dashboard-badge"><FaUserGraduate />Student Portal</span>
            <h1>Welcome back, {student?.name || "Student"}</h1>
            <p>Personalized AI-powered academic support for your next success milestone.</p>
            <div className="student-welcome-actions">
              <Link to="/student/dashboard#academic-support" className="student-welcome-button primary"><FaBookReader />Academic Support</Link>
              <Link to="/chatbot" className="student-welcome-button secondary"><FaRobot />AI Guidance</Link>
            </div>
          </div>

          {student && <StudentProfileSummary student={student} displayValue={displayValue} onProfileUpdate={handleProfileUpdate} />}
        </header>

        {error && <p className="student-message error" role="alert">{error}</p>}

        {loading ? (
          <p className="student-message">Loading your dashboard...</p>
        ) : student ? (
          <>
            <OverviewCards student={student} displayValue={displayValue} />
            <AcademicOverview student={student} displayValue={displayValue} />
            <StudentAcademicSupport student={student} />
            <AcademicJourneyMap student={student} />
            <AIIntelligenceHub student={student} displayValue={displayValue} />
            <ProgressSummary student={student} displayValue={displayValue} />
            <StudentAlerts alerts={student.alerts} />
            <QuickActions />
          </>
        ) : !error && <p className="student-message">Student profile not available.</p>}
      </div>
    </main>
  );
};

export default StudentDashboard;
