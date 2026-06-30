import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const Forgetpass = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendResetLink = async (e) => {
    e.preventDefault();

    const contact = identifier.trim();

    if (!contact) {
      setMessage("Please enter your email address or phone number.");
      return;
    }

    setIsSending(true);
    setMessage("");

    try {
      const response = await axios.post("http://127.0.0.1:3002/send-reset-otp", {
        identifier: contact,
      });

      if (response.data.success) {
        navigate("/verify", {
          state: {
            email: contact,
            isPasswordReset: true,
          },
        });
        setIdentifier("");
        return;
      }

      setMessage(response.data.message || "Unable to send OTP email. Please try again.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to send OTP email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="forgetpass-page">
      <button
        type="button"
        className="forget-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>

      <Navbar />

      <main className="forget-reset-section">
        <section className="forget-reset-content">
          <BrandLogo className="auth-form-logo" size="small" />
          <span className="forget-kicker">Account recovery</span>
          <h1>Forgot Password?</h1>
          <p>
            Enter your email address or phone number and we will send an OTP to verify your
            account.
          </p>

          <form onSubmit={handleSendResetLink} className="forget-form">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email address or phone number"
              required
            />
            <button type="submit" className="forget-btn" disabled={isSending}>
              {isSending ? "Sending..." : "Send OTP"}
            </button>
          </form>

          {message && <div className="message-box">{message}</div>}
        </section>
      </main>
    </div>
  );
};

export default Forgetpass;
