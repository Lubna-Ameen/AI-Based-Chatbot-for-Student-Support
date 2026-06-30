import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './Navbar';
import BrandLogo from './BrandLogo';
import './Style.css';

const Contact = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! Welcome to AI Assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const userMessage = inputValue.toLowerCase();

      const newMessage = {
        id: messages.length + 1,
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      setInputValue('');

      setTimeout(() => {
        let reply = "";

        if (
          userMessage.includes("hello") ||
          userMessage.includes("hi")
        ) {
          reply = "Hello How can I help you today?";
        }

        else if (
          userMessage.includes("about") ||
          userMessage.includes("project")
        ) {
          reply =
            "This project is an AI-Based Chatbot for Student Support designed to help universities identify at-risk students using AI and Machine Learning.";
        }

        else if (
          userMessage.includes("login")
        ) {
          reply =
            "You can login using your registered email and password on the Login page. If you forgot your password, you can reset it from the Forget Password page.";
        }

        else if (
          userMessage.includes("register") ||
          userMessage.includes("signup")
        ) {
          reply =
            "You can create a new account from the Register page using your email and a secure password.";
        }

        else if (
          userMessage.includes("help")
        ) {
          reply =
            "Sure I can help you with login, registration, and project information.";
        }

        else {
          reply =
            "I'm here to help Please ask me anything about the project or support system.";
        }

        const aiResponse = {
          id: messages.length + 2,
          text: reply,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
      }, 800);
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

      <Navbar />

      <section className="contact-hero">
        <div className="hero-content">
          <h1>Get in Touch with Our AI Assistant</h1>
          <p>
            Ask questions, get support, or share feedback instantly
          </p>
        </div>
      </section>

      <div className="contact-container">
        <div className="chat-wrapper">

          <div className="chat-card">

            <div className="chat-header">
              <div className="header-content">

                <div className="ai-avatar">
                  <BrandLogo className="chat-logo" size="chat" />
                </div>

                <div className="header-text">
                  <h2>AI Assistant Chat</h2>
                  <p className="status">
                    Always online • Ready to help
                  </p>
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

            </div>

            <div className="chat-input-wrapper">

              <textarea
                className="chat-input"
                placeholder="Describe your question…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
              />

              <div className="chat-actions">

                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                >
                  <span>✈️</span>
                </button>

              </div>
            </div>

          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <BrandLogo className="footer-logo" size="chat" />
          <p>
            &copy; {currentYear} AI-Based Chatbot for Student Support.
            All rights reserved.
          </p>

          <p>
            Empowering Education Through Artificial Intelligence
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Contact;
