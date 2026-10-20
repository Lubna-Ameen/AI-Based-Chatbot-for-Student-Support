import { FaShieldAlt } from "react-icons/fa";

const RiskStatus = ({ student }) => {
  const hasRisk = student.riskStatus !== null && student.riskStatus !== undefined && String(student.riskStatus).trim();
  return (
    <article className="student-dashboard-section student-insight-card" id="risk-status" aria-labelledby="risk-status-title">
      <span className="student-card-icon"><FaShieldAlt /></span>
      <div><span className="student-section-kicker">Academic support</span><h2 id="risk-status-title">Risk Status</h2>
        {hasRisk ? <><strong className="student-insight-value">{student.riskStatus}</strong>{student.riskReason && <p>{student.riskReason}</p>}</> : <p>No risk prediction available yet.</p>}
      </div>
    </article>
  );
};
export default RiskStatus;
