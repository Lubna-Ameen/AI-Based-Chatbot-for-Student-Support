import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Style.css';

const Contact = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 Welcome to AI Assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setInputValue('');

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          text: "Thank you for your message! Our support team will get back to you shortly. 🚀",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="contact-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand">
          <h2>AI Chatbot</h2>
        </div>
        <ul className="nav-links">
          <li><button onClick={() => navigate('/')} className="link-button">Home</button></li>
          <li><button onClick={() => navigate('/about')} className="link-button">About Us</button></li>
          <li><button onClick={() => navigate('/contact')} className="link-button">Contact Us</button></li>
        </ul>
        
      </nav>

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-content">
          <h1>Get in Touch with Our AI Assistant</h1>
          <p>Ask questions, get support, or share feedback instantly</p>
        </div>
      </section>

      {/* Main Chat Container */}
      <div className="contact-container">
        <div className="chat-wrapper">
          {/* Chat Card - Glassmorphism */}
          <div className="chat-card">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="header-content">
                <div className="ai-avatar">
                  <span>🤖</span>
                </div>
                <div className="header-text">
                  <h2>AI Assistant Chat</h2>
                  <p className="status">Always online • Ready to help</p>
                </div>
              </div>
              <button 
                className="close-btn" 
                onClick={() => navigate(-1)}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender}`}
                >
                  <div className="message-bubble">
                    {message.text}
                  </div>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
              <div id="messages-end"></div>
            </div>

            {/* Chat Input Area */}
            <div className="chat-input-wrapper">
              <textarea
                className="chat-input"
                placeholder="Describe your question…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
              />

              {/* Action Icons */}
              <div className="chat-actions">
                <button className="action-btn" title="Attach file">
                  <span>📎</span>
                </button>
                <button className="action-btn" title="Upload image">
                  <span>🖼️</span>
                </button>
                <button className="action-btn" title="Voice message">
                  <span>🎤</span>
                </button>
                <button className="action-btn" title="Emoji">
                  <span>😊</span>
                </button>
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  title="Send message"
                >
                  <span>✈️</span>
                </button>
              </div>
            </div>
          </div>

          {/* Side Info Card */}
          <div className="info-card">
            <h3>Quick Links</h3>
            <ul className="quick-links">
              <li>
                <button onClick={() => navigate('/about')} className="link-button">
                  📖 About Our Project
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="link-button">
                  🔐 Login to Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/register')} className="link-button">
                  ✍️ Create Account
                </button>
              </li>
              <li>
                <a href="mailto:support@aichatbot.com" className="link-button">
                  📧 Email Support
                </a>
              </li>
            </ul>

            <div className="info-stats">
              <div className="stat">
                <div className="stat-icon">⚡</div>
                <div className="stat-text">
                  <p className="stat-label">Response Time</p>
                  <p className="stat-value">Instant</p>
                </div>
              </div>
              <div className="stat">
                <div className="stat-icon">✓</div>
                <div className="stat-text">
                  <p className="stat-label">Support</p>
                  <p className="stat-value">24/7 Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2024 AI-Based Chatbot for Student Support. All rights reserved.</p>
          <p>Empowering Education Through Artificial Intelligence</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
