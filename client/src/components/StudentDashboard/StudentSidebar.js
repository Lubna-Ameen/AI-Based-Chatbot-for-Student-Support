import {
  FaBell,
  FaBookOpen,
  FaChartLine,
  FaGraduationCap,
  FaHome,
  FaLightbulb,
  FaRobot,
  FaShieldAlt,
  FaSignOutAlt,
  FaTimes,
  FaUserGraduate,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import BrandLogo from "../BrandLogo";

const navigation = [
  { label: "Dashboard", href: "#dashboard", icon: <FaHome /> },
  { label: "My Profile", href: "#my-profile", icon: <FaUserGraduate /> },
  { label: "Academic Overview", href: "#academic-overview", icon: <FaGraduationCap /> },
  { label: "My Progress", to: "/my-progress", icon: <FaChartLine /> },
  { label: "Risk Status", href: "#risk-status", icon: <FaShieldAlt /> },
  { label: "AI Prediction", href: "#ai-prediction", icon: <FaRobot /> },
  { label: "Recommendations", href: "#recommendations", icon: <FaLightbulb /> },
  { label: "Notifications", to: "/notifications", icon: <FaBell /> },
  { label: "AI Chatbot", to: "/chatbot", icon: <FaRobot /> },
  { label: "Academic Support", to: "/contact", icon: <FaBookOpen /> },
];

const StudentSidebar = ({ isOpen, onClose, onLogout }) => (
  <>
    <button
      type="button"
      className={`student-sidebar-overlay ${isOpen ? "is-visible" : ""}`}
      onClick={onClose}
      aria-label="Close student portal menu"
      tabIndex={isOpen ? 0 : -1}
    />
    <aside className={`student-sidebar ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen}>
      <div className="student-sidebar-header">
        <BrandLogo variant="full" size="nav" />
        <button type="button" className="student-sidebar-close" onClick={onClose} aria-label="Close menu"><FaTimes /></button>
      </div>
      <div className="student-sidebar-title"><span>Student Portal</span><small>Academic services</small></div>
      <nav className="student-sidebar-navigation" aria-label="Student portal navigation">
        {navigation.map((item) => item.to ? (
          <Link key={item.label} to={item.to} onClick={onClose}>{item.icon}<span>{item.label}</span></Link>
        ) : (
          <a key={item.label} href={item.href} onClick={onClose}>{item.icon}<span>{item.label}</span></a>
        ))}
      </nav>
      <button type="button" className="student-sidebar-logout" onClick={onLogout}><FaSignOutAlt /><span>Logout</span></button>
    </aside>
  </>
);

export default StudentSidebar;
