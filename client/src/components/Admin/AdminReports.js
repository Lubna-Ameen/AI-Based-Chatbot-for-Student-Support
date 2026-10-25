import { useEffect, useState } from "react";
import { get } from "./adminApi";

const downloadReport = async (path, filename) => {
  const response = await get(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reportType, setReportType] = useState("summary");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    Promise.all([get("/reports/summary"), get("/students")])
      .then(([summaryResponse, studentsResponse]) => {
        setReport(summaryResponse.data.report);
        setStudents(studentsResponse.data.students || []);
      })
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load report data.")
      );
  }, []);

  const download = async () => {
    setIsDownloading(true);
    setError("");
    try {
      if (reportType === "student" && !selectedStudentId) {
        setError("Select a student before downloading an academic report.");
        return;
      }
      if (reportType === "student") {
        const student = students.find((entry) => entry._id === selectedStudentId);
        await downloadReport(
          `/reports/students/${selectedStudentId}/academic.pdf`,
          `academic-report-${student?.studentId || selectedStudentId}.pdf`
        );
      } else {
        await downloadReport("/reports/summary.pdf", "admin-summary-report.pdf");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to download PDF report.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="admin-student-management admin-section-card">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">INSIGHTS & EXPORTS</p>
          <h2>Reports</h2>
          <p>Summary metrics use verified academic records only.</p>
        </div>
      </div>
      {error && <p className="admin-auth-error" role="alert">{error}</p>}
      <div className="admin-report-metrics">
        <article><span>Students</span><strong>{report?.studentCount ?? "—"}</strong></article>
        <article><span>Verified academic records</span><strong>{report?.verifiedAcademicRecords ?? "—"}</strong></article>
        <article><span>Average CGPA</span><strong>{report?.averageCGPA ?? "Unavailable"}</strong></article>
        <article><span>Average attendance</span><strong>{report?.averageAttendancePercentage == null ? "Unavailable" : `${report.averageAttendancePercentage}%`}</strong></article>
        <article><span>Active academic warnings</span><strong>{report?.activeAcademicWarnings ?? "—"}</strong></article>
      </div>
      <section className="admin-report-export">
        <div>
          <h3>Export report</h3>
          <p>Choose a summary or a single-student academic report.</p>
        </div>
        <div className="admin-report-filters">
          <label>
            Report type
            <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option value="summary">Admin summary</option>
              <option value="student">Student academic report</option>
            </select>
          </label>
          {reportType === "student" && (
            <label>
              Student
              <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} · {student.studentId || student.email}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="admin-primary-button"
            onClick={download}
            disabled={isDownloading || (reportType === "student" && !selectedStudentId)}
          >
            {isDownloading ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </section>
    </section>
  );
};

export { downloadReport };
export default AdminReports;
