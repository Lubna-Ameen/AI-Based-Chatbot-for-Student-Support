import { Link } from "react-router-dom";

const StudentAlerts = ({ alerts }) => {
  const items = Array.isArray(alerts) ? alerts.filter(Boolean).slice(0, 5) : [];
  return (
    <section className="student-dashboard-section" id="latest-alerts" aria-labelledby="student-alerts-title">
      <div className="student-section-heading split"><div><span className="student-section-kicker">Recent updates</span><h2 id="student-alerts-title">Latest Alerts</h2></div><Link className="student-outline-button" to="/notifications">View All Notifications</Link></div>
      {items.length ? <ul className="student-item-list alerts">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="student-empty-state">No academic alerts available yet.</p>}
    </section>
  );
};
export default StudentAlerts;
