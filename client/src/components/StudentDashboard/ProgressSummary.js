import { Link } from "react-router-dom";

const ProgressSummary = ({ student, displayValue }) => {
  const metrics = [
    ["GPA", student.gpa], ["Attendance", student.attendance],
    ["Assignment Average", student.assignmentAverage], ["Quiz Average", student.quizAverage],
    ["Failed Courses", student.failedCourses], ["Overall Performance", student.overallPerformance],
  ];
  return (
    <section className="student-dashboard-section" id="progress-summary" aria-labelledby="progress-summary-title">
      <div className="student-section-heading split"><div><span className="student-section-kicker">Your learning journey</span><h2 id="progress-summary-title">Progress Summary</h2></div><Link className="student-outline-button" to="/my-progress">View My Progress</Link></div>
      <div className="student-metric-grid">
        {metrics.map(([label, value]) => <div className="student-metric" key={label}><span>{label}</span><strong>{displayValue(value)}</strong></div>)}
      </div>
    </section>
  );
};
export default ProgressSummary;
