import { FaRobot } from "react-icons/fa";

const AIPrediction = ({ student }) => {
  const hasPrediction = student.aiPrediction !== null && student.aiPrediction !== undefined && String(student.aiPrediction).trim();
  return (
    <article className="student-dashboard-section student-insight-card" id="ai-prediction" aria-labelledby="ai-prediction-title">
      <span className="student-card-icon"><FaRobot /></span>
      <div><span className="student-section-kicker">Future ML insight</span><h2 id="ai-prediction-title">AI Prediction</h2>
        {hasPrediction ? <><strong className="student-insight-value">{student.aiPrediction}</strong>{student.riskProbability !== undefined && student.riskProbability !== null && <p>Risk probability: {student.riskProbability}</p>}{Array.isArray(student.importantFactors) && student.importantFactors.length > 0 && <ul>{student.importantFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul>}</> : <p>AI prediction is not available yet.</p>}
      </div>
    </article>
  );
};
export default AIPrediction;
