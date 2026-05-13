import { useNavigate } from "react-router-dom";
import "./Style.css";
 
const Home = () => {
 
  const navigate = useNavigate();
 
  return (
    <div className="home-page">
      <div className="container home-container">
        <div className="top-section home-illustration">
        <div className="home-left">
          <img
            src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
            alt="person using laptop"
            className="home-person-image"
          />

          <h1 className="home-slogan">Ask, Learn, and Succeed with AI</h1>
        </div>

        <div className="home-robots">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
            alt="robot assistant"
            className="home-robot-image"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
            alt="chat robot"
            className="home-robot-image small"
          />
        </div>
      </div>

      <div className="home-actions">
        <button type="button" onClick={() => navigate("/login")}>
          Login
        </button>

        <button type="button" onClick={() => navigate("/register")}>
          Register
        </button>
      </div>

      <button
        type="button"
        className="back-icon"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        &larr;
      </button>
      </div>
    </div>
  );
};
 
export default Home;
