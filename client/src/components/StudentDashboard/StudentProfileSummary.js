import { FaEnvelope, FaIdCard, FaUniversity, FaUserGraduate } from "react-icons/fa";

const StudentProfileSummary = ({ student, displayValue }) => {
  const details = [
    { label: "Full Name", value: student.name, icon: <FaUserGraduate /> },
    { label: "Student ID", value: student.studentId, icon: <FaIdCard /> },
    { label: "Email", value: student.email, icon: <FaEnvelope /> },
    { label: "Department", value: student.department, icon: <FaUniversity /> },
    { label: "Major / Program", value: student.program, icon: <FaUserGraduate /> },
    { label: "Academic Year", value: student.academicYear, icon: <FaIdCard /> },
  ];

  return (
    <section className="student-dashboard-section" id="my-profile" aria-labelledby="student-profile-title">
      <div className="student-profile-heading">
        <div className="student-profile-avatar">{(student.name || "S").charAt(0).toUpperCase()}</div>
        <div>
          <span className="student-section-kicker">Student profile</span>
          <h2 id="student-profile-title">{displayValue(student.name, "Student")}</h2>
          <p>{displayValue(student.program, "Program not available yet")}</p>
        </div>
      </div>
      <dl className="student-detail-grid">
        {details.map((detail) => (
          <div key={detail.label}>
            <dt>{detail.icon}{detail.label}</dt>
            <dd>{displayValue(detail.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default StudentProfileSummary;
