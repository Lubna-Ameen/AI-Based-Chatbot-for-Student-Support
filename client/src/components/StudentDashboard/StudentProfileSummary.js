import { useState } from "react";
import { FaEnvelope, FaEdit, FaIdCard, FaSave, FaTimes, FaUniversity, FaUserGraduate } from "react-icons/fa";

const StudentProfileSummary = ({ student, displayValue, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    name: student?.name || "",
    phoneNumber: student?.phoneNumber || "",
  });
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const details = [
    { label: "Full Name", value: student.name, icon: <FaUserGraduate /> },
    { label: "Student ID", value: student.studentId, icon: <FaIdCard /> },
    { label: "Email", value: student.email, icon: <FaEnvelope /> },
    { label: "Department", value: student.department, icon: <FaUniversity /> },
    { label: "Major / Program", value: student.program, icon: <FaUserGraduate /> },
    { label: "Academic Year", value: student.academicYear, icon: <FaIdCard /> },
  ];

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  };

  const handleCancelEdit = () => {
    setStatusMessage({ type: "", text: "" });
    setFormValues({ name: student?.name || "", phoneNumber: student?.phoneNumber || "" });
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: "", text: "" });

    const trimmedName = formValues.name.trim();
    const trimmedPhone = formValues.phoneNumber.trim();

    if (!trimmedName) {
      setStatusMessage({ type: "error", text: "Full name is required." });
      return;
    }

    if (trimmedPhone && !/^\+?[0-9()\-\s]{7,20}$/.test(trimmedPhone)) {
      setStatusMessage({ type: "error", text: "Enter a valid phone number or leave it blank." });
      return;
    }

    if (!onProfileUpdate) {
      setStatusMessage({ type: "error", text: "Profile update action is not available." });
      return;
    }

    try {
      setIsSubmitting(true);
      await onProfileUpdate({
        name: trimmedName,
        phoneNumber: trimmedPhone,
      });
      setStatusMessage({ type: "success", text: "Profile updated successfully." });
      setIsEditing(false);
    } catch (error) {
      setStatusMessage({ type: "error", text: error.response?.data?.message || "Unable to update profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="student-dashboard-section" id="my-profile" aria-labelledby="student-profile-title">
      <div className="student-profile-heading">
        <div className="student-profile-avatar">{(student.name || "S").charAt(0).toUpperCase()}</div>
        <div className="student-profile-header-copy">
          <span className="student-section-kicker">Student profile</span>
          <h2 id="student-profile-title">{displayValue(student.name, "Student")}</h2>
          <p>{displayValue(student.program, "Program not available yet")}</p>
        </div>
        {!isEditing && (
          <button type="button" className="student-inline-action" onClick={() => setIsEditing(true)}>
            <FaEdit /> Edit Profile
          </button>
        )}
      </div>

      {statusMessage.text && (
        <p className={`student-form-message ${statusMessage.type}`}>{statusMessage.text}</p>
      )}

      {isEditing ? (
        <form className="student-profile-form" onSubmit={handleSubmit}>
          <div className="student-profile-form-grid">
            <div className="student-form-field">
              <label htmlFor="student-profile-name">Full Name</label>
              <input
                id="student-profile-name"
                name="name"
                type="text"
                value={formValues.name}
                onChange={handleFieldChange}
                placeholder="Enter your full name"
              />
            </div>
            <div className="student-form-field">
              <label htmlFor="student-profile-phone">Phone Number</label>
              <input
                id="student-profile-phone"
                name="phoneNumber"
                type="tel"
                value={formValues.phoneNumber}
                onChange={handleFieldChange}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="student-form-actions">
            <button type="submit" className="student-primary-button" disabled={isSubmitting}>
              <FaSave /> {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="student-secondary-button" onClick={handleCancelEdit}>
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="student-detail-grid">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.icon}{detail.label}</dt>
              <dd>{displayValue(detail.value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

export default StudentProfileSummary;
