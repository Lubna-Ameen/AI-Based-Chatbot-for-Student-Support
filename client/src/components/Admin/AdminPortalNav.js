import { useEffect, useState } from "react";
import {
  FaBars,
  FaBell,
  FaBookOpen,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaFileAlt,
  FaHome,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaUserGraduate,
} from "react-icons/fa";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../BrandLogo";
import { get, post } from "./adminApi";
import "./AdminPortal.css";

const ADMIN_SECTIONS = [
  { label: "Overview", path: "/admin/dashboard", icon: FaHome },
  { label: "Students", path: "/admin/students", icon: FaUserGraduate },
  { label: "Academic Records", path: "/admin/academic-records", icon: FaBookOpen },
  { label: "Profile", path: "/admin/profile", icon: FaUserCircle },
  { label: "Reports", path: "/admin/reports", icon: FaFileAlt },
  { label: "Risk Monitoring", path: "/admin/risk-monitoring", icon: FaChartLine },
  { label: "Change Password", path: "/admin/change-password", icon: FaClipboardList },
];

const AdminPortalNav = ({ collapsed = false, onCollapsedChange = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle =
    ADMIN_SECTIONS.find((section) => section.path === location.pathname)?.label || "Admin Portal";
  const displayName = profile?.displayName || profile?.email || (profileError ? "Profile unavailable" : "Administrator");
  const initials = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    let active = true;
    get("/auth/me")
      .then((response) => {
        if (active) {
          setProfile(response.data.admin);
          setProfileError("");
        }
      })
      .catch((error) => {
        if (active) {
          setProfile(null);
          setProfileError(error.response?.data?.message || "Unable to load Admin profile.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const logout = async () => {
    try {
      setLogoutError("");
      await post("/auth/logout", {}, { csrf: true });
      navigate("/admin/login", { replace: true });
    } catch (error) {
      setLogoutError(error.response?.data?.message || "Unable to end the Admin session. Please try again.");
    }
  };

  return (
    <>
      <aside
        className={`admin-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar-brand">
          <button
            type="button"
            className="admin-sidebar-logo"
            onClick={() => navigate("/admin/dashboard")}
            aria-label="Go to Admin overview"
          >
            <BrandLogo variant="full" size="nav" />
          </button>
          <button
            type="button"
            className="admin-sidebar-collapse"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <FaTimes />
          </button>
        </div>

        <div className="admin-sidebar-label">ADMINISTRATION</div>
        <nav className="admin-sidebar-links">
          {ADMIN_SECTIONS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end
              title={collapsed ? label : undefined}
              className={({ isActive }) => `admin-sidebar-link${isActive ? " is-active" : ""}`}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="admin-sidebar-link admin-sidebar-logout"
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
        >
          <FaSignOutAlt aria-hidden="true" />
          <span>Logout</span>
        </button>
      </aside>

      {mobileOpen && (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Dismiss navigation menu backdrop"
        />
      )}

      <header className="admin-topbar">
        <button
          type="button"
          className="admin-mobile-menu"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <FaBars />
        </button>
        <div className="admin-topbar-heading">
          <span>Admin Portal</span>
          <h1>{pageTitle}</h1>
        </div>
        <div className="admin-topbar-actions">
          <button
            type="button"
            className="admin-notifications-button"
            aria-label="Notifications are not configured"
            title="Notifications are not configured"
            disabled
          >
            <FaBell aria-hidden="true" />
          </button>
          <button type="button" className="admin-topbar-logout" onClick={logout}>
            <FaSignOutAlt aria-hidden="true" />
            <span>Logout</span>
          </button>
          <span className="admin-topbar-divider" aria-hidden="true" />
          <button
            type="button"
            className="admin-topbar-profile"
            onClick={() => navigate("/admin/profile")}
            aria-label={`Admin profile: ${displayName}`}
          >
            <span className="admin-avatar">{initials}</span>
            <span className="admin-topbar-profile-copy">
              <strong>{displayName}</strong>
              <small>{profileError ? "Could not load account" : profile?.title || "Administrator"}</small>
            </span>
          </button>
        </div>
      </header>
      {logoutError && (
        <div className="admin-logout-error" role="alert">
          {logoutError}
        </div>
      )}
    </>
  );
};

export default AdminPortalNav;
