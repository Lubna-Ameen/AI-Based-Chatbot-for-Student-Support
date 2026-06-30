import { useMemo, useState } from "react";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const resetToken = location.state?.resetToken || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRules = useMemo(
    () => [
      {
        label: "At least 6 characters",
        valid: password.length >= 6,
      },
      {
        label: "At least 4 numbers",
        valid: (password.match(/\d/g) || []).length >= 4,
      },
      {
        label: "At least 1 special character (!, @, #, $, etc.)",
        valid: /[^A-Za-z0-9]/.test(password),
      },
      {
        label: "At least one uppercase and one lowercase letter",
        valid: /[A-Z]/.test(password) && /[a-z]/.test(password),
      },
    ],
    [password]
  );

  const isPasswordValid = passwordRules.every((rule) => rule.valid);
  const showPasswordRules = password.length > 0 && !isPasswordValid;
  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setMessage("");

    if (!isPasswordValid || password !== confirmPassword) {
      return;
    }

    if (!email || !resetToken) {
      setMessage("Please verify your OTP before resetting your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("http://127.0.0.1:3002/reset-password", {
        email,
        resetToken,
        password,
      });

      if (response.data.success) {
        navigate("/login");
        return;
      }

      setMessage(response.data.message || "Unable to reset password. Please try again.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="change-password-page">
      <Navbar />

      <main className="change-password-section">
        <form className="change-password-form" onSubmit={handleSubmit}>
          <BrandLogo className="change-password-logo" size="medium" />

          <h1>Change Password</h1>
          <p>
            Create a strong new password to keep your AI Student Support account
            secure.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New Password"
            required
          />

          {showPasswordRules && (
            <div className="password-rule-list">
              {passwordRules.map((rule) => (
                <div
                  className={rule.valid ? "password-rule valid" : "password-rule"}
                  key={rule.label}
                >
                  <FaCheckCircle />
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>
          )}

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />

          {(passwordsDoNotMatch || (submitted && password !== confirmPassword)) && (
            <p className="change-password-error">
              New password and confirm password do not match.
            </p>
          )}

          {message && <p className="change-password-error">{message}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Changing..." : "Change Password"}
          </button>
        </form>
      </main>

      <button
        type="button"
        className="change-password-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>
    </div>
  );
};

export default ChangePassword;
