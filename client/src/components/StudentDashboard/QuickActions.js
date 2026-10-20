import { FaBell, FaChartLine, FaLightbulb, FaRobot } from "react-icons/fa";
import { Link } from "react-router-dom";

const QuickActions = () => (
  <section className="student-dashboard-section" aria-labelledby="quick-actions-title">
    <div className="student-section-heading"><span className="student-section-kicker">Useful shortcuts</span><h2 id="quick-actions-title">Quick Actions</h2></div>
    <div className="student-action-grid">
      <Link to="/chatbot"><FaRobot />Ask AI Assistant</Link>
      <Link to="/my-progress"><FaChartLine />My Progress</Link>
      <Link to="/notifications"><FaBell />Notifications</Link>
      <a href="#recommendations"><FaLightbulb />Recommendations</a>
    </div>
  </section>
);
export default QuickActions;
