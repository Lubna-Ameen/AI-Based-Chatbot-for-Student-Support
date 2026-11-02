import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaBookOpen, FaCalendarAlt, FaChartLine, FaCheckCircle, FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Style.css";

const API_BASE = "http://localhost:3002";

const getStoredStudent = () => {
  try {
    return JSON.parse(localStorage.getItem("studentUser") || "null");
  } catch (error) {
    return null;
  }
};

const formatMetric = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value).trim() || fallback;
};

const MyProgress = () => {
  const navigate = useNavigate();
  const student = getStoredStudent();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const email = student?.email ? String(student.email).trim() : "";
    if (!email) {
      setLoading(false);
      setError("Student account not found. Please sign in to view progress.");
      return;
    }

    let isMounted = true;
    axios.get(`${API_BASE}/student/academic-progress`, {
      params: { email },
      withCredentials: true,
    })
      .then((response) => {
        if (!isMounted) return;
        const nextProgress = response?.data?.progress || {};
        setProgress(nextProgress);
        setError(nextProgress?.available ? "" : "Academic data is not available yet.");
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.response?.data?.message || "Unable to load academic progress.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [student?.email]);

  const metricCards = useMemo(() => {
    if (!progress) {
      return [];
    }

    return [
      { label: "Current Academic Level", value: progress.academicLevel || "Not available", icon: <FaGraduationCap /> },
      { label: "Completed Courses", value: formatMetric(progress.completedCourses, "Not available"), icon: <FaBookOpen /> },
      { label: "Remaining Courses", value: formatMetric(progress.remainingCourses, "Not available"), icon: <FaCheckCircle /> },
      { label: "Completed Credits", value: formatMetric(progress.completedCredits, "Not available"), icon: <FaChartLine /> },
      { label: "Remaining Credits", value: formatMetric(progress.remainingCredits, "Not available"), icon: <FaCalendarAlt /> },
      { label: "Graduation Progress", value: progress.graduationProgress !== null && progress.graduationProgress !== undefined ? `${progress.graduationProgress}%` : "Not available", icon: <FaChartLine /> },
    ];
  }, [progress]);

  const milestones = progress?.milestones || [];
  const studyPlanCourses = Array.isArray(progress?.studyPlan) ? progress.studyPlan : [];

  return (
    <main className="search-page my-progress-page">
      <Navbar variant="dashboard" />
      <section className="search-dashboard-shell feature-page-shell my-progress-shell">
        <button type="button" className="feature-back" onClick={() => navigate("/student/dashboard")}>
          <FaArrowLeft /> Dashboard
        </button>

        <div className="search-section-heading">
          <h1><FaChartLine /> My Progress</h1>
          <span>Academic progress overview</span>
        </div>

        {error && !loading && (
          <div className="message-box my-progress-message-box" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="progress-empty-state">Loading academic progress...</div>
        ) : !progress || !progress.available ? (
          <div className="progress-empty-state">
            <h3>Academic progress is not available yet.</h3>
            <p>Your verified academic record and study plan are still being updated or are not available.</p>
          </div>
        ) : (
          <>
            <div className="progress-metrics-grid">
              {metricCards.map((card) => (
                <article key={card.label} className="progress-metric-card">
                  <span className="progress-metric-icon">{card.icon}</span>
                  <div>
                    <small>{card.label}</small>
                    <strong>{card.value}</strong>
                  </div>
                </article>
              ))}
            </div>

            <div className="progress-detail-grid">
              <section className="progress-detail-card">
                <div className="progress-card-heading">
                  <h3>Academic Journey / Milestones</h3>
                </div>
                <ul className="progress-milestones">
                  {milestones.length > 0 ? milestones.map((milestone, index) => (
                    <li key={`${milestone.label}-${index}`} className={milestone.status === "current" ? "is-current" : ""}>
                      <span className="progress-milestone-status" />
                      <div>
                        <strong>{milestone.label}</strong>
                        <small>{milestone.status === "current" ? "Current milestone" : milestone.status === "completed" ? "Completed" : "Upcoming"}</small>
                      </div>
                    </li>
                  )) : <li className="progress-empty-inline">Milestones are not available yet.</li>}
                </ul>
              </section>

              <section className="progress-detail-card">
                <div className="progress-card-heading">
                  <h3>Study Plan</h3>
                </div>
                {studyPlanCourses.length > 0 ? (
                  <ul className="progress-study-plan">
                    {studyPlanCourses.map((course) => (
                      <li key={`${course.courseCode || course.courseName}-${course.creditHours || ""}`}>
                        <strong>{course.courseCode || "Course"}</strong>
                        <span>{course.courseName || "Course details not available"}</span>
                        <small>{course.creditHours ? `${course.creditHours} credit hours` : "Credit hours not available"}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="progress-empty-inline">A verified study plan is not available yet.</p>
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default MyProgress;
