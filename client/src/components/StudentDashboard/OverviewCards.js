import { FaBell, FaChartLine, FaGraduationCap, FaShieldAlt } from "react-icons/fa";

const OverviewCards = ({ student, displayValue }) => {
  const cards = [
    { label: "Current GPA", value: displayValue(student.gpa), icon: <FaGraduationCap /> },
    { label: "Overall Performance", value: displayValue(student.overallPerformance), icon: <FaChartLine /> },
    { label: "Risk Status", value: displayValue(student.riskStatus), icon: <FaShieldAlt /> },
    { label: "Active Alerts", value: Array.isArray(student.alerts) && student.alerts.length ? student.alerts.length : "Not available yet", icon: <FaBell /> },
  ];

  return (
    <section className="student-overview-grid" aria-label="Academic overview cards">
      {cards.map((card) => (
        <article className="student-overview-card" key={card.label}>
          <span className="student-card-icon">{card.icon}</span>
          <div><p>{card.label}</p><strong>{card.value}</strong></div>
        </article>
      ))}
    </section>
  );
};

export default OverviewCards;
