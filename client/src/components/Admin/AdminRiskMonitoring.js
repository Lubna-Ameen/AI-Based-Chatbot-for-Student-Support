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

  const getRiskStatus = (student) => {
    if (student.lowGpa || student.attendanceConcern || (student.academicWarnings || []).length > 2) {
      return { label: "Critical", className: "is-critical" };
    }
    if (student.lowGpa || student.attendanceConcern || (student.academicWarnings || []).length > 0) {
      return { label: "Monitor", className: "is-watch" };
    }
    return { label: "Healthy", className: "is-healthy" };
  };

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
      {!thresholdsConfigured.lowGpa && <p className="admin-warning-banner">Low-GPA threshold is not configured.</p>}
      {!thresholdsConfigured.attendance && <p className="admin-warning-banner">Attendance threshold is not configured.</p>}

      {students.length ? (
        <div className="admin-student-table-wrap">
          <table className="admin-student-table">
            <thead>
              <tr><th>Student</th><th>Department</th><th>CGPA</th><th>Attendance</th><th>Warnings</th><th>Risk status</th><th>ML prediction</th></tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const riskStatus = getRiskStatus(student);
                return (
                  <tr key={student.studentId || student.name}>
                    <td>{student.name} ({student.studentId || "No ID"})</td>
                    <td>{student.department || "Unavailable"}</td>
                    <td>{student.gpa ?? "Unavailable"}</td>
                    <td>{student.attendance == null ? "Unavailable" : `${student.attendance}%`}</td>
                    <td>{student.academicWarnings?.length ?? 0}</td>
                    <td><span className={`admin-risk-badge ${riskStatus.className}`}>{riskStatus.label}</span></td>
                    <td>{student.mlPrediction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty-state-card">
          <div>
            <strong>No verified records available</strong>
            <span>Risk monitoring data will appear when academic records are available.</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminRiskMonitoring;
