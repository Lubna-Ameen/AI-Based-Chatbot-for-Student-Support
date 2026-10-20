import {
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaLeaf,
  FaShieldAlt,
  FaSignOutAlt,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { clearAdminSession } from "../adminAccounts";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [report, setReport] = useState(null);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [studentResponse, reportResponse] = await Promise.all([
        axios.get("http://127.0.0.1:3002/admin/students"),
        axios.get("http://127.0.0.1:3002/admin/reports/student-summary"),
      ]);
      setStudents(studentResponse.data.students || []);
      setReport(reportResponse.data.report || null);
    } catch (error) { setMessage(error.response?.data?.message || "Unable to load student data."); }
  };

  useEffect(() => { loadData(); }, []);

  const saveStudent = async (event) => {
    event.preventDefault();
    try {
      await axios.put(`http://127.0.0.1:3002/admin/students/${editing._id}`, editing);
      setEditing(null); setMessage("Student information updated."); await loadData();
    } catch (error) { setMessage(error.response?.data?.message || "Unable to update student."); }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login");
  };

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-orb orb-left"></div>
      <div className="admin-dashboard-orb orb-right"></div>

      <nav className="admin-dashboard-navbar">
        <button
          type="button"
          className="admin-auth-brand"
          onClick={() => navigate("/")}
          aria-label="Go to welcome page"
        >
          <BrandLogo variant="full" size="nav" />
        </button>

        <div className="admin-dashboard-actions">
          <button
            type="button"
            className="admin-nav-pill is-active"
            onClick={() => navigate("/admin/dashboard")}
          >
            Overview
          </button>
          <button
            type="button"
            className="admin-nav-pill"
            onClick={() => navigate("/admin/students")}
          >
            Students
          </button>
        </div>

        <button
          type="button"
          className="admin-dashboard-logout"
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          Logout
        </button>
      </nav>

      <section className="admin-dashboard-hero">
        <div>
          <span className="admin-portal-badge">
            <FaShieldAlt />
            Admin Dashboard
          </span>
          <h1>Student Support Command Center</h1>
          <p>
            Monitor student support activity, review risk signals, and keep the
            AI assistant experience running smoothly.
          </p>
        </div>

        <div className="admin-dashboard-emblem" aria-hidden="true">
          <FaLeaf className="dashboard-leaf leaf-a" />
          <FaLeaf className="dashboard-leaf leaf-b" />
          <FaChartLine />
        </div>
      </section>

      <section className="admin-dashboard-grid">
        {[
          { label: "Number of Students", value: report?.totalStudents ?? "—", icon: <FaUsers /> },
          { label: "Verified Students", value: report?.verifiedStudents ?? "—", icon: <FaCheckCircle /> },
          { label: "Unverified Students", value: report?.unverifiedStudents ?? "—", icon: <FaClock /> },
        ].map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <div className="admin-stat-icon">{stat.icon}</div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-student-management">
        <div className="search-section-heading"><h2>Student Management</h2><span>View and update student details</span></div>
        {message && <p className="message-box">{message}</p>}
        <div className="admin-student-table-wrap"><table className="admin-student-table"><thead><tr><th>Name</th><th>Student ID</th><th>Email</th><th>Program</th><th>Year</th><th>Department</th><th>Action</th></tr></thead><tbody>
          {students.map((student) => <tr key={student._id}><td>{student.name}</td><td>{student.studentId || "—"}</td><td>{student.email}</td><td>{student.program || "—"}</td><td>{student.academicYear || "—"}</td><td>{student.department || "—"}</td><td><button type="button" onClick={() => setEditing({ ...student })}>Edit</button></td></tr>)}
          {!students.length && <tr><td colSpan="7">No students found.</td></tr>}
        </tbody></table></div>
        {editing && <form className="admin-student-edit" onSubmit={saveStudent}><h3>Edit Student</h3>{["name", "studentId", "email", "phoneNumber", "program", "academicYear", "department"].map((field) => <label key={field}>{field.replace(/([A-Z])/g, " $1")}<input value={editing[field] || ""} onChange={(e) => setEditing({ ...editing, [field]: e.target.value })} required={["name", "email"].includes(field)} /></label>)}<div><button type="submit">Save changes</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div></form>}
        <section className="admin-report-summary"><h2>Generated Student Report</h2><p>Total students: <strong>{report?.totalStudents ?? "—"}</strong></p><p>Verified: <strong>{report?.verifiedStudents ?? "—"}</strong> · Unverified: <strong>{report?.unverifiedStudents ?? "—"}</strong></p>{report?.studentsByProgram?.map((item) => <p key={item.program}>{item.program}: {item.count}</p>)}</section>
      </section>
    </main>
  );
};

export default AdminDashboard;
