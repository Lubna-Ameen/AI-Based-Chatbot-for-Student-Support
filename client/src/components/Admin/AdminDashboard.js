import { FaBookOpen, FaChartLine, FaCheckCircle, FaClock, FaUsers } from "react-icons/fa";
import { useEffect, useState } from "react";
import { get } from "./adminApi";
import AdminPortalNav from "./AdminPortalNav";

const AdminDashboard = () => {
  const [report, setReport] = useState(null);
  const [academicSummary, setAcademicSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    Promise.all([get("/reports/student-summary"), get("/reports/summary")])
      .then(([studentResponse, academicResponse]) => {
        setReport(studentResponse.data.report || null);
        setAcademicSummary(academicResponse.data.report || null);
      })
      .catch((error) =>
        setMessage(error.response?.data?.message || "Unable to load dashboard summary.")
      );
  }, []);

  const stats = [
    {
      label: "Total students",
      value: report?.totalStudents ?? "—",
      note: "Student accounts",
      icon: FaUsers,
    },
    {
      label: "Verified students",
      value: report?.verifiedStudents ?? "—",
      note: "Verified accounts",
      icon: FaCheckCircle,
    },
    {
      label: "Awaiting verification",
      value: report?.unverifiedStudents ?? "—",
      note: "Unverified accounts",
      icon: FaClock,
    },
    {
      label: "Verified academic records",
      value: academicSummary?.verifiedAcademicRecords ?? "—",
      note: "Validated source records",
      icon: FaCheckCircle,
    },
    {
      label: "Average CGPA",
      value: academicSummary?.averageCGPA ?? "Unavailable",
      note: "Verified academic records",
      icon: FaChartLine,
    },
    {
      label: "Average attendance",
      value: academicSummary?.averageAttendancePercentage == null
        ? "Unavailable"
        : `${academicSummary.averageAttendancePercentage}%`,
      note: "Verified attendance records",
      icon: FaClock,
    },
    {
      label: "Active academic warnings",
      value: academicSummary?.activeAcademicWarnings ?? "—",
      note: "Verified records only",
      icon: FaBookOpen,
    },
  ];

  return (
    <div className={`admin-portal-shell${collapsed ? " is-sidebar-collapsed" : ""}`}>
      <AdminPortalNav collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main className="admin-workspace">
        <section className="admin-overview-intro">
          <div>
            <p className="admin-eyebrow">UNIVERSITY ADMINISTRATION</p>
            <h2>Welcome to your overview</h2>
            <p>Review student account activity and access academic administration tools.</p>
          </div>
        </section>

        {message && <p className="admin-inline-error" role="alert">{message}</p>}
        <section className="admin-overview-grid" aria-label="Student account summary">
          {stats.map(({ label, value, note, icon: Icon }) => (
            <article className="admin-overview-card" key={label}>
              <div className="admin-overview-card-top">
                <span>{label}</span>
                <span className="admin-overview-icon"><Icon aria-hidden="true" /></span>
              </div>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </section>
        <section className="admin-overview-note">
          <h3>Academic insights</h3>
          <p>
            Academic summaries and risk indicators are available when verified student records
            are present. No academic data or predictions are generated when source records are
            unavailable.
          </p>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
