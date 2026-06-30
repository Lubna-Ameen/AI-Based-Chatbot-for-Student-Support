import { useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEnvelope,
  FaFingerprint,
  FaKey,
  FaLeaf,
  FaLock,
  FaShieldAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { isAdminEmail, setAdminPassword } from "../adminAccounts";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const steps = ["Forgot Password", "Email Verification", "Change Password"];
const DEMO_VERIFICATION_CODE = "123456";

const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const passwordRules = useMemo(
    () => [
      { label: "At least 8 characters", valid: password.length >= 8 },
      { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
      { label: "At least one number", valid: /\d/.test(password) },
      { label: "At least one special character", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const isPasswordInvalid =
    step === 2 && password.length > 0 && passwordRules.some((rule) => !rule.valid);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (step === 0) {
      if (!isAdminEmail(email)) {
        setError("This email is not authorized as an admin.");
        return;
      }

      setError("");
      setStep(1);
      return;
    }

    if (step === 1) {
      if (verificationCode.trim() !== DEMO_VERIFICATION_CODE) {
        setError("The verification code is incorrect. Use the demo code 123456.");
        return;
      }

      setError("");
      setStep(2);
      return;
    }

    if (passwordRules.some((rule) => !rule.valid)) {
      setError("Please choose a password that meets all admin password rules.");
      return;
    }

    if (password !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setAdminPassword(email, password);
    setError("");
    navigate("/admin/login");
  };

  return (
    <main className="admin-auth-page">
      <div className="admin-orb admin-orb-one"></div>
      <div className="admin-orb admin-orb-two"></div>
      <div className="admin-orb admin-orb-three"></div>

      <nav className="admin-auth-navbar" aria-label="Admin password recovery">
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
          Password Recovery
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
          <div className="admin-glass-chip chip-one">Reset Token</div>
          <div className="admin-glass-chip chip-two">Protected</div>
        </div>

        <section className="admin-auth-card admin-forgot-card">
          <div className="admin-stepper" aria-label="Password reset progress">
            {steps.map((stepLabel, index) => (
              <div
                className={index <= step ? "admin-step active" : "admin-step"}
                key={stepLabel}
              >
                <span>{index + 1}</span>
                <strong>{stepLabel}</strong>
              </div>
            ))}
          </div>

          <form className="admin-auth-form" onSubmit={handleSubmit}>
            <div className="admin-step-content" key={step}>
              <span className="admin-portal-badge">
                {step === 0 && <FaEnvelope />}
                {step === 1 && <FaFingerprint />}
                {step === 2 && <FaKey />}
                {steps[step]}
              </span>
              <BrandLogo className="admin-card-logo" size="small" />

              {step === 0 && (
                <>
                <h1>Forgot Password</h1>
                <p>Enter your admin email to receive a verification code.</p>
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
                {error && <p className="admin-auth-error">{error}</p>}
                <button type="submit" className="admin-primary-button">
                  Send Verification Code
                </button>
                </>
              )}

              {step === 1 && (
                <>
                <h1>Email Verification</h1>
                <p>Enter the verification code for your admin password reset.</p>
                <div className="admin-demo-code">
                  Demo verification code: <strong>{DEMO_VERIFICATION_CODE}</strong>
                </div>
                <label>
                  <span>Verification Code</span>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(event) => {
                      setVerificationCode(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter verification code"
                    required
                  />
                </label>
                {error && <p className="admin-auth-error">{error}</p>}
                <button type="submit" className="admin-primary-button">
                  Verify Code
                </button>
                </>
              )}

              {step === 2 && (
                <>
                <h1>Change Password</h1>
                <p>Create a new password for your admin account.</p>
                <label>
                  <span>New Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Create new password"
                    required
                  />
                </label>

                {isPasswordInvalid && (
                  <div className="admin-password-rules">
                    {passwordRules.map((rule) => (
                      <div
                        className={rule.valid ? "admin-rule valid" : "admin-rule"}
                        key={rule.label}
                      >
                        <FaCheckCircle />
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <label>
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Confirm new password"
                    required
                  />
                </label>
                {error && <p className="admin-auth-error">{error}</p>}
                <button type="submit" className="admin-primary-button">
                  Reset Password
                </button>
                </>
              )}
            </div>
          </form>
        </section>
      </section>

      <button
        type="button"
        className="admin-auth-back"
        onClick={() => (step > 0 ? setStep((currentStep) => currentStep - 1) : navigate("/admin/login"))}
        aria-label="Go back"
        title="Back"
      >
        <FaArrowLeft />
      </button>
    </main>
  );
};

export default AdminForgotPassword;
