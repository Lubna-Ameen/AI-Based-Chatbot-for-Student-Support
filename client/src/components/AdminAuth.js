import { useState } from "react";
import {
  FaArrowLeft,
  FaFingerprint,
  FaKey,
  FaLeaf,
  FaLock,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { setAdminSession, validateAdminLogin } from "../adminAccounts";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();
    const result = validateAdminLogin(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setError("");
    setAdminSession(email);
    navigate("/admin/dashboard");
  };

  return (
    <main className="admin-auth-page">
      <div className="admin-orb admin-orb-one"></div>
      <div className="admin-orb admin-orb-two"></div>
      <div className="admin-orb admin-orb-three"></div>

      <nav className="admin-auth-navbar" aria-label="Admin authentication">
        <button
          type="button"
          className="admin-auth-brand"
          onClick={() => navigate("/")}
          aria-label="Go to welcome page"
        >
          <BrandLogo variant="full" size="nav" />
        </button>
        <span className="admin-nav-status">
          <FaShieldAlt />
          Secure Admin Access
        </span>
      </nav>

      <section className="admin-auth-shell">
        <div className="admin-visual-panel" aria-hidden="true">
          <div className="admin-security-ring ring-one"></div>
          <div className="admin-security-ring ring-two"></div>
          <div className="admin-security-core">
            <BrandLogo className="admin-core-logo" size="medium" />
          </div>
          <div className="admin-floating-icon admin-icon-lock">
            <FaLock />
          </div>
          <div className="admin-floating-icon admin-icon-key">
            <FaKey />
          </div>
          <div className="admin-floating-icon admin-icon-fingerprint">
            <FaFingerprint />
          </div>
          <div className="admin-leaf-detail admin-leaf-one">
            <FaLeaf />
          </div>
          <div className="admin-leaf-detail admin-leaf-two">
            <FaLeaf />
          </div>
          <div className="admin-glass-chip chip-one">Encrypted</div>
          <div className="admin-glass-chip chip-two">Verified</div>
        </div>

        <section className="admin-auth-card">
          <form className="admin-auth-form" onSubmit={handleLogin}>
            <span className="admin-portal-badge">
              <FaUserShield />
              Admin Portal
            </span>
            <BrandLogo className="admin-card-logo" size="small" />
            <h1>Admin Login</h1>
            <p>Access your admin dashboard securely.</p>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter password"
                required
              />
            </label>

            {error && <p className="admin-auth-error">{error}</p>}

            <div className="admin-form-row">
              <label className="admin-checkbox">
                <input type="checkbox" />
                <span>Remember Me</span>
              </label>
              <button
                type="button"
                className="admin-link-button"
                onClick={() => navigate("/admin/forgot-password")}
              >
                Forgot Password
              </button>
            </div>

            <button type="submit" className="admin-primary-button">
              Log In
            </button>
          </form>
        </section>
      </section>

      <button
        type="button"
        className="admin-auth-back"
        onClick={() => navigate("/")}
        aria-label="Go back to welcome page"
        title="Back"
      >
        <FaArrowLeft />
      </button>
    </main>
  );
};

export default AdminAuth;
