const Recommendations = ({ recommendations }) => {
  const items = Array.isArray(recommendations) ? recommendations.filter(Boolean) : [];
  return (
    <section className="student-dashboard-section" id="recommendations" aria-labelledby="recommendations-title">
      <div className="student-section-heading"><span className="student-section-kicker">Personalized guidance</span><h2 id="recommendations-title">Recommendations</h2></div>
      {items.length ? <ul className="student-item-list">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="student-empty-state">No recommendations available yet.</p>}
    </section>
  );
};
export default Recommendations;
