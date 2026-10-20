const AcademicOverview = ({ student, displayValue }) => {
  const fields = [
    ["Current GPA", student.gpa], ["Semester", student.semester],
    ["Academic Year", student.academicYear], ["Major / Program", student.program],
    ["Department", student.department], ["Registered Courses", student.registeredCoursesCount],
    ["Credits", student.credits],
  ];
  return (
    <section className="student-dashboard-section" id="academic-overview" aria-labelledby="academic-overview-title">
      <div className="student-section-heading"><span className="student-section-kicker">Academic details</span><h2 id="academic-overview-title">Academic Overview</h2></div>
      <dl className="student-detail-grid compact">
        {fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{displayValue(value)}</dd></div>)}
      </dl>
    </section>
  );
};
export default AcademicOverview;