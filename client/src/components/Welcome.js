import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <main className="welcome-page">
      <section className="welcome-hero">
        <Navbar showAdminPortal />

        <div className="welcome-content">
          <div className="welcome-left">
            <span className="welcome-kicker">AI-powered campus assistance</span>
            <h1 className="welcome-title">
              Smarter student support, available anytime.
            </h1>
            <p className="welcome-copy">
              Help students get fast answers, plan study time, and navigate
              academic services through a polished AI assistant built for modern
              learning teams.
            </p>

            <div className="welcome-actions">
              <button
                type="button"
                className="welcome-start primary"
                onClick={() => navigate("/login")}
              >
                Get Started
              </button>
            </div>

            <div className="welcome-trust">
              <span><FaCheckCircle /> Instant guidance</span>
              <span><FaCheckCircle /> Study support</span>
              <span><FaCheckCircle /> Clean workflow</span>
            </div>
          </div>

          <div className="welcome-right">
            <div className="welcome-product-showcase">
              <div className="welcome-product-header">
                <span className="welcome-status-dot"></span>
                AI Assistant Online
              </div>
              <div className="welcome-chat-row ai">
                How can I help with your student services today?
              </div>
              <div className="welcome-chat-row user">
                I need help planning my coursework.
              </div>
              <div className="welcome-insight-card">
                <span>Recommended next step</span>
                <strong>Build a weekly study plan in under 2 minutes.</strong>
              </div>
              <BrandLogo className="welcome-hero-logo" size="medium" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Welcome;
