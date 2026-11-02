import axios from "axios";
import { useRef, useState } from "react";
import { FaArrowLeft, FaCheckCircle, FaFilePdf, FaUpload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Style.css";

const API_BASE = "http://localhost:3002";
const MAX_PDF_SIZE = 10 * 1024 * 1024;

const inferSupportCategory = (question = "") => {
  const normalizedQuestion = String(question).toLowerCase();

  if (/(gpa|cgpa|semester.*gpa|grade|grades)/i.test(normalizedQuestion)) {
    return "GPA / Academic Performance";
  }
  if (/(register|registration|add.*course|drop.*course|schedule)/i.test(normalizedQuestion)) {
    return "Course Registration";
  }
  if (/(prerequisite|prereq|requirement)/i.test(normalizedQuestion)) {
    return "Course Prerequisites";
  }
  if (/(graduat|progress|next academic level|academic standing|eligible)/i.test(normalizedQuestion)) {
    return "Academic Progress / Graduation";
  }
  if (/(attendance|absence|missed class|missed lecture)/i.test(normalizedQuestion)) {
    return "Attendance / Absence";
  }
  return "Other Academic Issues";
};

const buildSupportTransfer = (question, answer) => {
  const trimmedQuestion = String(question || "").trim();
  const trimmedAnswer = String(answer || "").trim();
  const summary = trimmedAnswer.length > 220 ? `${trimmedAnswer.slice(0, 220).trim()}...` : trimmedAnswer;

  return {
    subject: trimmedQuestion ? (trimmedQuestion.length > 90 ? `${trimmedQuestion.slice(0, 87).trim()}...` : trimmedQuestion) : "Academic support request",
    category: inferSupportCategory(trimmedQuestion),
    priority: "Medium",
    preferredContact: "Email",
    description: [
      trimmedQuestion,
      summary ? `AI response: ${summary}` : "",
      "Reason for escalation: The student still needs academic assistance.",
    ].filter(Boolean).join("\n\n"),
    aiResponse: summary,
    reasonForEscalation: "The student still needs academic assistance.",
  };
};

const Chatbot = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const acceptFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdf(null); setMessage("Only PDF files are supported."); return;
    }
    if (file.size > MAX_PDF_SIZE) {
      setPdf(null); setMessage("PDF files must be 10 MB or smaller."); return;
    }
    setPdf(file); setMessage("");
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) { setMessage("Enter your question before submitting."); return; }

    const storedStudent = (() => {
      try { return JSON.parse(localStorage.getItem("studentUser") || "null"); }
      catch { return null; }
    })();

    if (!storedStudent?.email) {
      setMessage("Please log in to ask the chatbot about your academic record.");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setFeedbackMessage("");

    try {
      const response = await axios.post(`${API_BASE}/student/chatbot`, {
        email: storedStudent.email,
        question: trimmedQuestion,
        pdfName: pdf?.name || null,
      }, {
        withCredentials: true,
      });

      const answer = response.data?.answer || response.data?.message || "No response was returned by the chatbot.";
      setChatHistory((current) => [...current, { question: trimmedQuestion, answer }]);
      setMessage(answer);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Unable to process your question right now.";
      setChatHistory((current) => [...current, { question: trimmedQuestion, answer: errorMessage }]);
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolved = () => {
    setFeedbackMessage("Thanks for letting us know. The conversation remains available in the chat.");
  };

  const handleNeedAcademicSupport = () => {
    if (!chatHistory.length) return;
    const latestEntry = chatHistory[chatHistory.length - 1];
    const transferPayload = buildSupportTransfer(latestEntry.question, latestEntry.answer);
    navigate("/student/dashboard#academic-support", { state: { supportTransfer: transferPayload } });
  };

  return (
    <main className="search-page">
      <Navbar variant="dashboard" />
      <section className="search-dashboard-shell feature-page-shell">
        <button type="button" className="feature-back" onClick={() => navigate("/student/dashboard")}><FaArrowLeft /> Dashboard</button>
        <h1>Ask the Student Support Chatbot</h1>
        <p>Type your own question. Attaching a PDF adds context; it does not automatically generate a question.</p>
        <form className="chatbot-form" onSubmit={submitQuestion}>
          <div className="pdf-drop-zone" role="button" tabIndex="0" onClick={() => inputRef.current?.click()} onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); acceptFile(e.dataTransfer.files[0]); }}>
            <FaUpload /><strong>Drag and drop a PDF here</strong><span>or click to select (maximum 10 MB)</span>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => acceptFile(e.target.files[0])} />
          </div>
          {pdf && <p className="selected-pdf"><FaFilePdf /> {pdf.name} ({(pdf.size / 1024 / 1024).toFixed(2)} MB)</p>}
          <label htmlFor="student-question">Your question</label>
          <textarea id="student-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like help with?" rows="5" />
          <button type="submit" className="register-btn" disabled={isLoading}>{isLoading ? "Processing..." : "Submit question"}</button>
        </form>

        {chatHistory.length > 0 && (
          <div className="chatbot-thread" aria-live="polite">
            {chatHistory.map((entry, index) => (
              <div className="chatbot-message-pair" key={`${entry.question}-${index}`}>
                <div className="chatbot-question-bubble">
                  <span className="chatbot-label">You</span>
                  <p>{entry.question}</p>
                </div>
                <div className="chatbot-answer-bubble">
                  <span className="chatbot-label">AI Assistant</span>
                  <p>{entry.answer}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {message && (
          <div className="chatbot-response-actions">
            <button type="button" className="chatbot-action-button success" onClick={handleSolved}>
              <FaCheckCircle /> This Solved My Issue
            </button>
            <button type="button" className="chatbot-action-button primary" onClick={handleNeedAcademicSupport}>
              Need Academic Support
            </button>
          </div>
        )}

        {feedbackMessage && <p className="message-box" role="status" aria-live="polite">{feedbackMessage}</p>}
      </section>
    </main>
  );
};
export default Chatbot;
