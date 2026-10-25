import { useEffect, useState } from "react";
import { get, put } from "./adminApi";

const STUDENT_FIELDS = [
  "name",
  "studentId",
  "email",
  "phoneNumber",
  "program",
  "academicYear",
  "department",
];

const AdminStudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const loadStudents = async () => {
    try {
      const response = await get("/students");
      setStudents(response.data.students || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load student data.");
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const saveStudent = async (event) => {
    event.preventDefault();
    try {
      await put(`/students/${editing._id}`, editing);
      setEditing(null);
      setMessage("Student information updated.");
      await loadStudents();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update student.");
    }
  };

  const filteredStudents = students.filter((student) =>
    [
      student.name,
      student.studentId,
      student.email,
      student.program,
      student.department,
      student.academicYear,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <section className="admin-student-management">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">STUDENT SERVICES</p>
          <h2>Student Management</h2>
          <p>Search the student directory and update account details.</p>
        </div>
        <span className="admin-count-badge">{students.length} students</span>
      </div>
      {message && <p className="message-box">{message}</p>}
      <label className="admin-search-field">
        <span className="sr-only">Search students</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, university ID, email, or department"
        />
      </label>
      <div className="admin-student-table-wrap">
        <table className="admin-student-table">
          <thead><tr><th>Student</th><th>University ID</th><th>Email</th><th>Major</th><th>Year</th><th>Department</th><th>Action</th></tr></thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td><strong>{student.name}</strong></td><td>{student.studentId || "—"}</td>
                <td>{student.email}</td><td>{student.program || "—"}</td>
                <td>{student.academicYear || "—"}</td><td>{student.department || "—"}</td>
                <td><button type="button" className="admin-secondary-button" onClick={() => setEditing({ ...student })}>Edit</button></td>
              </tr>
            ))}
            {!filteredStudents.length && (
              <tr>
                <td className="admin-empty-state" colSpan="7">
                  {students.length ? "No students match your search." : "No student records are available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <form className="admin-student-edit" onSubmit={saveStudent}>
          <h3>Edit student details</h3>
          {STUDENT_FIELDS.map((field) => (
            <label key={field}>
              {field.replace(/([A-Z])/g, " $1")}
              <input
                value={editing[field] || ""}
                onChange={(event) => setEditing({ ...editing, [field]: event.target.value })}
                required={["name", "email"].includes(field)}
              />
            </label>
          ))}
          <div className="admin-form-actions">
            <button type="submit" className="admin-primary-button">Save changes</button>
            <button type="button" className="admin-secondary-button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
};

export default AdminStudentManagement;
