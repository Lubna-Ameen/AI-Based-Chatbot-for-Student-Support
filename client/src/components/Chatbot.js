import { useRef, useState } from "react";
import { FaArrowLeft, FaFilePdf, FaUpload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Style.css";

const MAX_PDF_SIZE = 10 * 1024 * 1024;

const Chatbot = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");

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

  const submitQuestion = (event) => {
    event.preventDefault();
    if (!question.trim()) { setMessage("Enter your question before submitting."); return; }
    setMessage(pdf ? "Your question and PDF are ready for processing." : "Your question is ready for processing.");
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
          <button type="submit" className="register-btn">Submit question</button>
          {message && <p className="message-box" role="status">{message}</p>}
        </form>
      </section>
    </main>
  );
};
export default Chatbot;
