import { FaArrowLeft, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Style.css";

const MyProgress = () => {
  const navigate = useNavigate();
  return (
    <main className="search-page">
      <Navbar variant="dashboard" />
      <section className="search-dashboard-shell feature-page-shell">
        <button type="button" className="feature-back" onClick={() => navigate("/student/dashboard")}><FaArrowLeft /> Dashboard</button>
        <div className="search-section-heading"><h1><FaChartLine /> My Progress</h1><span>Personal learning overview</span></div>
        <div className="search-activity-grid">
          <article className="search-activity-card"><span><FaChartLine /></span><div><h3>Learning activity</h3><p>Your completed support activities and milestones will be summarized here.</p></div></article>
        </div>
      </section>
    </main>
  );
};
export default MyProgress;
