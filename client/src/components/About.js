import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import BrandLogo from './BrandLogo';
import './Style.css';

const About = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="about-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Empowering Student Success Through Artificial Intelligence</h1>
          <p className="hero-subtitle">
            Revolutionizing higher education in Oman through intelligent early intervention and personalized support
          </p>
        </div>
        <div className="hero-background">
          <div className="gradient-blob blob-1"></div>
          <div className="gradient-blob blob-2"></div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="intro-section">
        <div className="section-container">
          <div className="intro-content">
            <h2>About Our Project</h2>
            <p>
              The <strong>AI-Based Chatbot for Student Support</strong> is an innovative graduation project designed to transform 
              higher education in Oman. Our system leverages cutting-edge AI and Machine Learning technologies to identify 
              at-risk students and provide proactive, personalized support.
            </p>
            <p>
              By analyzing multiple data points, our intelligent system enables educational institutions to intervene early, 
              provide targeted assistance, and ultimately improve student success rates.
            </p>
          </div>
          <div className="intro-image">
            <BrandLogo className="about-official-logo" size="large" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">How We Identify At-Risk Students</h2>
          <div className="analysis-cards">
            <div className="analysis-card">
              <div className="card-icon"></div>
              <h3>Student Grades</h3>
              <p>Continuously monitors academic performance trends and identifies declining patterns</p>
            </div>
            <div className="analysis-card">
              <div className="card-icon"></div>
              <h3>Attendance Records</h3>
              <p>Tracks attendance patterns to identify disengagement and predict dropout risk</p>
            </div>
            <div className="analysis-card">
              <div className="card-icon"></div>
              <h3>LMS Activity</h3>
              <p>Analyzes Learning Management System interactions to understand student engagement levels</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="section-container">
          <div className="mission-grid">
            <div className="mission-card">
              <h3>Our Mission</h3>
              <p>
                To democratize access to intelligent educational support systems that empower institutions 
                to identify struggling students early and provide timely, personalized interventions that 
                enhance academic success and student well-being.
              </p>
            </div>
            <div className="mission-card">
              <h3>Project Objectives</h3>
              <ul>
                <li>Develop an intelligent student risk prediction system</li>
                <li>Provide real-time alerts for at-risk student identification</li>
                <li>Enable personalized recommendation generation</li>
                <li>Create actionable dashboards for educators</li>
                <li>Support early intervention strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">AI</div>
              <h3>AI Chatbot Support</h3>
              <p>Intelligent conversational agent providing 24/7 academic guidance and study assistance</p>
              <ul className="feature-list">
                <li>Answer student questions instantly</li>
                <li>Provide study tips and resources</li>
                <li>Offer academic counseling</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Smart Risk Prediction</h3>
              <p>Machine Learning algorithms that analyze multiple factors to predict at-risk students</p>
              <ul className="feature-list">
                <li>Grade trend analysis</li>
                <li>Attendance pattern detection</li>
                <li>Behavioral prediction models</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Personalized Recommendations</h3>
              <p>Tailored suggestions based on individual student needs and learning patterns</p>
              <ul className="feature-list">
                <li>Custom learning paths</li>
                <li>Resource suggestions</li>
                <li>Intervention strategies</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Performance Dashboard</h3>
              <p>Comprehensive analytics platform for educators and administrators</p>
              <ul className="feature-list">
                <li>Real-time performance metrics</li>
                <li>Visual data representation</li>
                <li>Comparative analytics</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Early Alert Notifications</h3>
              <p>Automated alerts for educators when students show risk indicators</p>
              <ul className="feature-list">
                <li>Real-time notifications</li>
                <li>Risk level assessment</li>
                <li>Actionable recommendations</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Secure & Private</h3>
              <p>Enterprise-grade security protecting sensitive student data</p>
              <ul className="feature-list">
                <li>Data encryption</li>
                <li>Privacy compliance</li>
                <li>Access controls</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="why-matters-section">
        <div className="section-container">
          <h2 className="section-title">Why This Project Matters</h2>
          <div className="impact-cards">
            <div className="impact-card">
              <h3>Reducing Dropout Rates</h3>
              <p>
                Early identification of at-risk students allows institutions to provide timely support 
                and interventions, significantly reducing student dropout rates and improving retention.
              </p>
            </div>
            <div className="impact-card">
              <h3>Data-Driven Decision Making</h3>
              <p>
                Educators and administrators can make informed decisions based on real-time, actionable 
                insights from comprehensive data analysis rather than intuition alone.
              </p>
            </div>
            <div className="impact-card">
              <h3>Empowering Students</h3>
              <p>
                Students receive personalized support and guidance exactly when they need it, fostering 
                confidence and enabling them to overcome academic challenges.
              </p>
            </div>
            <div className="impact-card">
              <h3>Improving Institutional Excellence</h3>
              <p>
                Institutions can optimize educational outcomes, improve rankings, and create an environment 
                where every student has the opportunity to succeed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Oman Vision 2040 Section */}
      <section className="vision-section">
        <div className="section-container">
          <h2 className="section-title">Oman Vision 2040 Alignment</h2>
          <div className="vision-content">
            <p>
              Our AI-Based Chatbot for Student Support aligns perfectly with <strong>Oman Vision 2040</strong>, 
              the sultanate's strategic development roadmap that emphasizes digital transformation and 
              knowledge-based economy development.
            </p>
            <div className="vision-alignment">
              <div className="alignment-item">
                <h3>Digital Transformation</h3>
                <p>Advancing Oman's digital infrastructure through innovative AI and technology solutions</p>
              </div>
              <div className="alignment-item">
                <h3>Quality Education</h3>
                <p>Enhancing educational quality and accessibility for all students in higher education</p>
              </div>
              <div className="alignment-item">
                <h3>Knowledge Economy</h3>
                <p>Building a skilled workforce through better educational outcomes and support systems</p>
              </div>
              <div className="alignment-item">
                <h3>Global Competitiveness</h3>
                <p>Positioning Omani institutions as leaders in AI-driven educational innovation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="tech-section">
        <div className="section-container">
          <h2 className="section-title">Technologies & Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-icon">AI</div>
              <h3>Machine Learning</h3>
              <p>Predictive models and algorithms</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon"></div>
              <h3>Backend</h3>
              <p>Node.js, Express, MongoDB</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon"></div>
              <h3>Frontend</h3>
              <p>React, React Router, Axios</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon"></div>
              <h3>Security</h3>
              <p>Bcrypt, JWT, Data Encryption</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon"></div>
              <h3>Analytics</h3>
              <p>Data Visualization, Real-time Dashboards</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon"></div>
              <h3>Cloud</h3>
              <p>Scalable infrastructure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2>Ready to Transform Education?</h2>
          <p>Join us in revolutionizing student support through artificial intelligence</p>
          <div className="cta-buttons">
            <button className="cta-btn primary" onClick={() => navigate('/login')}>
              Get Started
            </button>
            <button className="cta-btn secondary" onClick={() => navigate('/contact')}>
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <BrandLogo className="footer-logo" size="chat" />
          <p>&copy; {currentYear} AI-Based Chatbot for Student Support. All rights reserved.</p>
          <p>Empowering Education Through Artificial Intelligence</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
