import { useState } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaLeaf,
  FaLock,
  FaPowerOff,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const Logout = () => {
  const navigate = useNavigate();
  const [loggedOut, setLoggedOut] = useState(false);

  return (
    <div className="logout-page">
      <Navbar />

      <main className="logout-section">
        <section className="logout-visual" aria-label="Security illustration">
          <div className="logout-glow glow-one"></div>
          <div className="logout-glow glow-two"></div>
          <div className="logout-orbit orbit-a"></div>
          <div className="logout-orbit orbit-b"></div>
          <div className="logout-leaf leaf-one">
            <FaLeaf />
          </div>
          <div className="logout-leaf leaf-two">
            <FaLeaf />
          </div>
          <div className="logout-floating-icon lock-icon">
            <FaLock />
          </div>
          <div className="logout-floating-icon check-icon">
            <FaCheckCircle />
          </div>
          <div className="logout-floating-icon power-icon">
            <FaPowerOff />
          </div>
          <div className="logout-shield-core">
            <BrandLogo className="logout-core-logo" size="medium" />
          </div>
        </section>

        <section className="logout-content">
          <h1>
            Log <span>Out</span>
          </h1>
          <p>
            End your current session safely while keeping your AI Student
            Support account protected and ready for your next visit.
          </p>

          <div className="logout-actions">
            <button
              type="button"
              className="logout-primary"
              onClick={() => setLoggedOut(true)}
            >
              Log Out
            </button>
            <button
              type="button"
              className="logout-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>

          {loggedOut && (
            <div className="logout-success-message">
              <FaCheckCircle />
              <span>You have successfully logged out. See you next time!</span>
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        className="logout-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>
    </div>
  );
};

export default Logout;
