import { useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Contact Us", path: "/contact" },
  { label: "Login", path: "/login" },
  { label: "Register", path: "/register" },
  { label: "Logout", path: "/logout" },
];

const dashboardNavItems = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Contact Us", path: "/contact" },
  { label: "Logout", path: "/logout" },
];

const Navbar = ({ showAdminPortal = false, variant = "default" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = variant === "dashboard" ? dashboardNavItems : navItems;

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/welcome" || location.pathname === "/home";
    }

    return location.pathname === path;
  };

  return (
    <nav className="site-navbar" aria-label="Main navigation">
      <button
        type="button"
        className="site-navbar-brand"
        onClick={() => navigate("/")}
        aria-label="Go to homepage"
      >
        <BrandLogo variant="full" size="nav" />
      </button>

      <div className="site-navbar-links">
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className={isActive(item.path) ? "active" : ""}
            onClick={() => navigate(item.path)}
            aria-current={isActive(item.path) ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
        {showAdminPortal && (
          <button
            type="button"
            className="admin-portal-nav-button"
            onClick={() => navigate("/admin/login")}
          >
            Admin Portal
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
