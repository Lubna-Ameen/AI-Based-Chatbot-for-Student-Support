import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <button
        type="button"
        className="home-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>

      <Navbar />

      <main className="home-landing">
        <section className="home-hero-content">
          <span className="home-kicker">AI-powered academic support</span>
          <h1>Ask, Learn, and Succeed with AI</h1>
          <p>
            Get instant academic guidance, personalized study support, and
            trusted answers that help students move forward with confidence.
          </p>
          <button
            type="button"
            className="home-primary-cta"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
        </section>

        <section className="home-logo-hero" aria-label="AI Based Chatbot for Student Support logo">
          <div className="home-logo-orbit orbit-one"></div>
          <div className="home-logo-orbit orbit-two"></div>
          <div className="home-logo-orbit orbit-three"></div>
          <BrandLogo className="home-hero-logo" size="large" />
        </section>
      </main>

      <section className="home-feature-strip" aria-label="Platform features">
        {["Instant Answers", "Personalized Support", "Save Time", "Trusted & Secure"].map(
          (feature) => (
            <div className="home-feature-item" key={feature}>
              <FaCheckCircle />
              <span>{feature}</span>
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default Home;
