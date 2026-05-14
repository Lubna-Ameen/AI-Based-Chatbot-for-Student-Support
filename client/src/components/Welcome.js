import { FaHome, FaInfoCircle, FaPhone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Style.css";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <main className="welcome-page">
      <section className="welcome-card">

        {/* Title */}
        <h1 className="welcome-title">WELCOME TO AI CHATBOT</h1>

        <div className="welcome-content">

          {/* LEFT SIDE */}
          <div className="welcome-left">

            <img
              src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
              alt="person working at a computer"
              className="welcome-person"
            />

            <p className="welcome-copy">
              Ask questions, get answers, manage your time, and improve your
              study experience with our AI chatbot assistant.
            </p>

            <button
              type="button"
              className="welcome-start"
              onClick={() => navigate("/login")}
            >
              Get Started
            </button>
          </div>

          {/* RIGHT SIDE */}
          <div className="welcome-right">

            <div className="welcome-links">

              <button type="button" onClick={() => navigate("/home")}>
                Home <FaHome />
              </button>

              <button type="button" onClick={() => navigate("/about")}>
                About Us <FaInfoCircle />
              </button>

              <button type="button" onClick={() => navigate("/contact")}>
                Contact Us <FaPhone />
              </button>

            </div>

            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
              alt="robot"
              className="welcome-robot"
            />

          </div>

        </div>
      </section>
    </main>
  );
};

export default Welcome;