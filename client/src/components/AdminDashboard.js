import {
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaLeaf,
  FaShieldAlt,
  FaSignOutAlt,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { clearAdminSession } from "../adminAccounts";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const dashboardStats = [
  { label: "Active Students", value: "1,284", icon: <FaUsers /> },
  { label: "Support Requests", value: "86", icon: <FaClock /> },
  { label: "Resolved Cases", value: "94%", icon: <FaCheckCircle /> },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-orb orb-left"></div>
      <div className="admin-dashboard-orb orb-right"></div>

      <nav className="admin-dashboard-navbar">
        <button
          type="button"
          className="admin-auth-brand"
          onClick={() => navigate("/")}
          aria-label="Go to welcome page"
        >
          <BrandLogo variant="full" size="nav" />
        </button>

        <button
          type="button"
          className="admin-dashboard-logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          Logout
        </button>
      </nav>

      <section className="admin-dashboard-hero">
        <div>
          <span className="admin-portal-badge">
            <FaShieldAlt />
            Admin Dashboard
          </span>
          <h1>Student Support Command Center</h1>
          <p>
            Monitor student support activity, review risk signals, and keep the
            AI assistant experience running smoothly.
          </p>
        </div>

        <div className="admin-dashboard-emblem" aria-hidden="true">
          <FaLeaf className="dashboard-leaf leaf-a" />
          <FaLeaf className="dashboard-leaf leaf-b" />
          <FaChartLine />
        </div>
      </section>

      <section className="admin-dashboard-grid">
        {dashboardStats.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <div className="admin-stat-icon">{stat.icon}</div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>
    </main>
  );
};

export default AdminDashboard;
