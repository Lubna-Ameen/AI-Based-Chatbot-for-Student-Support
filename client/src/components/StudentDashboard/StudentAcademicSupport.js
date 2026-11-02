import { useEffect, useState } from "react";
import axios from "axios";
import { FaBookOpen, FaClock, FaExclamationTriangle, FaPaperPlane, FaShieldAlt } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";
const supportCategories = [
  "Course Registration",
  "GPA / Academic Performance",
  "Course Prerequisites",
  "Academic Progress / Graduation",
  "Attendance / Absence",
  "General Academic Advice",
  "Other Academic Issues",
];

const StudentAcademicSupport = ({ student }) => {
  const location = useLocation();
  const [formValues, setFormValues] = useState({
    category: supportCategories[0],
    subject: "",
    priority: "Medium",
    preferredContact: "Email",
    message: "",
  });
  const [transferNotice, setTransferNotice] = useState("");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const transferredIssue = location.state?.supportTransfer;

    if (transferredIssue && student?.email) {
      setTransferNotice("Your issue was transferred from AI Chatbot. Please review the details before submitting.");
      setFormValues((current) => ({
        ...current,
        category: supportCategories.includes(transferredIssue.category) ? transferredIssue.category : "Other Academic Issues",
        subject: transferredIssue.subject || current.subject,
        priority: ["Low", "Medium", "High"].includes(transferredIssue.priority) ? transferredIssue.priority : current.priority,
        preferredContact: ["Email", "Portal message", "Phone"].includes(transferredIssue.preferredContact) ? transferredIssue.preferredContact : current.preferredContact,
        message: transferredIssue.description || current.message,
      }));
      window.history.replaceState({}, "", "/student/dashboard#academic-support");
    }

    if (!student?.email) {
      setIsLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE}/student/support-requests`, {
          params: { email: student.email },
          withCredentials: true,
        });
        setRequests(Array.isArray(response.data?.requests) ? response.data.requests : []);
      } catch (error) {
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [student?.email, location.state]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (!student?.email) {
      setStatusMessage({ type: "error", text: "Student account is not available to submit a request." });
      return;
    }

    const trimmedSubject = formValues.subject.trim();
    const trimmedMessage = formValues.message.trim();

    if (!trimmedSubject || trimmedSubject.length < 3) {
      setStatusMessage({ type: "error", text: "Please add a short subject line." });
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 15) {
      setStatusMessage({ type: "error", text: "Please include enough detail for the support team to review your request." });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${API_BASE}/student/support-requests`, {
        email: student.email,
        category: formValues.category,
        subject: trimmedSubject,
        preferredContact: formValues.preferredContact,
        priority: formValues.priority,
        message: trimmedMessage,
      }, {
        withCredentials: true,
      });

      setRequests((current) => [response.data.request, ...current]);
      setStatusMessage({ type: "success", text: response.data.message || "Support request submitted successfully." });
      setTransferNotice("");
      setFormValues({
        category: supportCategories[0],
        subject: "",
        priority: "Medium",
        preferredContact: "Email",
        message: "",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to submit the academic support request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="student-dashboard-section student-support-section" id="academic-support" aria-labelledby="academic-support-title">
      <div className="student-section-heading split">
        <div>
          <span className="student-section-kicker">Academic support</span>
          <h2 id="academic-support-title">Support Request Center</h2>
        </div>
        <div className="student-support-status-badge"><FaShieldAlt /> Student help desk</div>
      </div>

      <div className="student-support-layout">
        {transferNotice && <p className="student-support-transfer-banner">{transferNotice}</p>}
        <form className="student-support-form" onSubmit={handleSubmit}>
          <div className="student-support-grid">
            <div className="student-form-field">
              <label htmlFor="support-category">Support category</label>
              <select id="support-category" name="category" value={formValues.category} onChange={handleInputChange}>
                {supportCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="student-form-field">
              <label htmlFor="support-priority">Priority</label>
              <select id="support-priority" name="priority" value={formValues.priority} onChange={handleInputChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="student-form-field">
              <label htmlFor="support-contact">Preferred contact</label>
              <select id="support-contact" name="preferredContact" value={formValues.preferredContact} onChange={handleInputChange}>
                <option value="Email">Email</option>
                <option value="Portal message">Portal message</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            <div className="student-form-field full-width">
              <label htmlFor="support-subject">Subject</label>
              <input
                id="support-subject"
                name="subject"
                type="text"
                value={formValues.subject}
                onChange={handleInputChange}
                placeholder="Brief request summary"
              />
            </div>

            <div className="student-form-field full-width">
              <label htmlFor="support-message">Request details</label>
              <textarea
                id="support-message"
                name="message"
                rows="5"
                value={formValues.message}
                onChange={handleInputChange}
                placeholder="Describe the academic issue, your current concern, and any relevant course or semester information."
              />
            </div>
          </div>

          {statusMessage.text && (
            <p className={`student-form-message ${statusMessage.type}`}>{statusMessage.text}</p>
          )}

          <div className="student-form-actions">
            <button type="submit" className="student-primary-button" disabled={isSubmitting}>
              <FaPaperPlane /> {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>

        <div className="student-support-history">
          <div className="student-support-history-header">
            <div>
              <span className="student-section-kicker">Recent requests</span>
              <h3>My support timeline</h3>
            </div>
            <FaBookOpen className="student-support-history-icon" />
          </div>

          {isLoading ? (
            <p className="student-support-empty">Loading your requests...</p>
          ) : requests.length === 0 ? (
            <div className="student-support-empty">
              <FaExclamationTriangle />
              <p>No academic support requests have been submitted yet.</p>
            </div>
          ) : (
            <div className="student-support-list">
              {requests.map((request) => (
                <article key={request._id || request.id} className="student-support-request">
                  <div className="student-support-request-topline">
                    <span className="student-support-tag">{request.category}</span>
                    <span className={`student-support-status ${String(request.status || "New").toLowerCase().replace(/\s+/g, "-")}`}>
                      {request.status || "New"}
                    </span>
                  </div>
                  <strong>{request.subject}</strong>
                  <p>{request.message}</p>
                  <div className="student-support-meta">
                    <span><FaClock /> {new Date(request.createdAt).toLocaleDateString()}</span>
                    <span>{request.priority || "Medium"}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StudentAcademicSupport;
