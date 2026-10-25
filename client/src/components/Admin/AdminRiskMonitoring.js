import { useEffect, useState } from "react";
import { get } from "./adminApi";

const AdminRiskMonitoring = () => {
  const [students, setStudents] = useState([]);
  const [thresholdsConfigured, setThresholdsConfigured] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    get("/risk-monitoring")
      .then((response) => {
        setStudents(response.data.students || []);
        setThresholdsConfigured(response.data.thresholdsConfigured || {});
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load risk monitoring data.")
      );
  }, []);

  return (
    <section className="admin-student-management admin-section-card">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">STUDENT WELLBEING</p>
          <h2>Risk Monitoring</h2>
          <p>Academic indicators are calculated from verified student records only.</p>
        </div>
      </div>
      {error && <p className="admin-auth-error" role="alert">{error}</p>}
      {!thresholdsConfigured.lowGpa && <p>Low-GPA threshold is not configured.</p>}
      {!thresholdsConfigured.attendance && <p>Attendance threshold is not configured.</p>}
      <div className="admin-student-table-wrap">
        <table className="admin-student-table">
          <thead>
            <tr><th>Student</th><th>Department</th><th>CGPA</th><th>Attendance</th><th>Warnings</th><th>ML prediction</th></tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.studentId || student.name}>
                <td>{student.name} ({student.studentId || "No ID"})</td>
                <td>{student.department || "Unavailable"}</td>
                <td>{student.gpa ?? "Unavailable"}{student.lowGpa ? " · Concern" : ""}</td>
                <td>{student.attendance == null ? "Unavailable" : `${student.attendance}%`}{student.attendanceConcern ? " · Concern" : ""}</td>
                <td>{student.academicWarnings.length}</td>
                <td>{student.mlPrediction}</td>
              </tr>
            ))}
            {!students.length && <tr><td className="admin-empty-state" colSpan="6">No verified academic records are available for monitoring.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminRiskMonitoring;
