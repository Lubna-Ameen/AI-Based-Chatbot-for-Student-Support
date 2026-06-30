import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBell,
  FaBookOpen,
  FaChartLine,
  FaCommentDots,
  FaGraduationCap,
  FaHome,
  FaMagic,
  FaRegClock,
  FaRegUser,
  FaSearch,
} from "react-icons/fa";
import BrandLogo, { LOGO_URL } from "./BrandLogo";
import Navbar from "./Navbar";
import "./Style.css";

const getStoredUserName = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("studentUser") || "{}");
    return storedUser.name || "Student";
  } catch (error) {
    return "Student";
  }
};

const SearchPage = () => {
  const navigate = useNavigate();
  const userName = getStoredUserName();

  const cards = [
    {
      title: "Chatbot",
      subtitle: "Ask the AI assistant for instant study guidance.",
      icon: <FaCommentDots />,
      className: "search-card-chatbot",
    },
    {
      title: "Academic Support",
      subtitle: "Find subject help, resources, and support services.",
      icon: <FaBookOpen />,
      className: "search-card-academic",
    },
    {
      title: "Notification",
      subtitle: "Track important reminders and student updates.",
      icon: <FaBell />,
      className: "search-card-notification",
    },
    {
      title: "My Progress",
      subtitle: "Review learning momentum and recent milestones.",
      icon: <FaChartLine />,
      className: "search-card-progress",
    },
  ];

  const activities = [
    {
      title: "AI study plan refreshed",
      detail: "New weekly focus areas are ready for review.",
      icon: <FaMagic />,
    },
    {
      title: "Academic support viewed",
      detail: "You opened advising resources for course planning.",
      icon: <FaGraduationCap />,
    },
    {
      title: "Progress check",
      detail: "Your dashboard was updated with recent activity.",
      icon: <FaRegClock />,
    },
  ];

  return (
    <main className="search-page">
      <Navbar variant="dashboard" />

      <button
        type="button"
        className="search-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>

      <div className="search-orb search-orb-left" aria-hidden="true" />
      <div className="search-orb search-orb-right" aria-hidden="true" />

      <section className="search-dashboard-shell" aria-label="Student support search page">
        <div className="search-logo-float search-logo-left" aria-hidden="true">
          <img src={LOGO_URL} alt="" />
        </div>
        <div className="search-logo-float search-logo-right" aria-hidden="true">
          <img src={LOGO_URL} alt="" />
        </div>

        <section className="search-welcome-panel">
          <div className="search-welcome-copy">
            <BrandLogo className="search-welcome-logo" size="small" />
            <span className="search-eyebrow">AI Student Dashboard</span>
            <h1>Hello, {userName}</h1>
            <p>Ready to continue your AI learning journey?</p>
          </div>

          <div className="search-ai-tile" aria-hidden="true">
            <BrandLogo size="medium" />
            <span>24/7 AI support</span>
          </div>
        </section>

        <div className="search-header">
          <label className="search-input-wrap" htmlFor="student-search">
            <input
              id="student-search"
              type="search"
              placeholder="Search subjects, support, AI help..."
            />
            <button type="button" aria-label="Search subjects, support, AI help">
              <FaSearch />
            </button>
          </label>
        </div>

        <div className="search-card-grid">
          {cards.map((card) => (
            <article className={`search-feature-card ${card.className}`} key={card.title}>
              <div className="search-card-topline">
                <span className="search-feature-icon">{card.icon}</span>
                <img src={LOGO_URL} alt="" aria-hidden="true" />
              </div>
              <div>
                <h2>{card.title}</h2>
                <p>{card.subtitle}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="search-activity-section" aria-labelledby="recent-activity-title">
          <div className="search-section-heading">
            <h2 id="recent-activity-title">Recent Activity</h2>
            <span>Today</span>
          </div>

          <div className="search-activity-grid">
            {activities.map((activity) => (
              <article className="search-activity-card" key={activity.title}>
                <span>{activity.icon}</span>
                <div>
                  <h3>{activity.title}</h3>
                  <p>{activity.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <nav className="search-bottom-nav" aria-label="Search page navigation">
          <button type="button" aria-label="Home" onClick={() => navigate("/")}>
            <FaHome />
          </button>
          <button type="button" className="is-active" aria-label="Search">
            <FaSearch />
          </button>
          <button type="button" aria-label="Notifications">
            <FaBell />
          </button>
          <button type="button" aria-label="Profile">
            <FaRegUser />
          </button>
        </nav>
      </section>
    </main>
  );
};

export default SearchPage;
