import { useEffect, useState } from "react";
import { get, put } from "./adminApi";
import { downloadReport } from "./AdminReports";

const emptyRecord = () => ({
  academicLevel: "",
  verified: false,
  semesters: [],
  studyPlan: [],
  studyPlanVerified: false,
  academicWarnings: [],
});

const emptyCourse = () => ({
  courseCode: "",
  courseName: "",
  creditHours: "",
  grade: "",
  attendancePercentage: "",
  status: "registered",
});

const numericValue = (value) => (value === "" ? null : Number(value));

const AdminAcademicRecords = () => {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [record, setRecord] = useState(emptyRecord);
  const [calculations, setCalculations] = useState({ available: false });
  const [semester, setSemester] = useState("");
  const [semesterGPA, setSemesterGPA] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [lcgpa, setLcgpa] = useState("");
  const [course, setCourse] = useState(emptyCourse);
  const [planCourse, setPlanCourse] = useState({ courseCode: "", courseName: "", creditHours: "" });
  const [warning, setWarning] = useState({ code: "", description: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("standing");

  useEffect(() => {
    get("/students")
      .then((response) => setStudents(response.data.students || []))
      .catch((requestError) =>
        setError(requestError.response?.data?.message || "Unable to load student list.")
      );
  }, []);

  const selectStudent = async (id) => {
    setStudentId(id);
    setError("");
    setMessage("");
    if (!id) {
      setStudent(null);
      setRecord(emptyRecord());
      setCalculations({ available: false });
      return;
    }
    try {
      const response = await get(`/students/${id}/academics`);
      setStudent(response.data.student);
      setRecord(response.data.academicRecord || emptyRecord());
      setCalculations(response.data.calculations || { available: false });
      setSemester("");
      setSemesterGPA("");
      setCgpa("");
      setLcgpa("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load academic record.");
    }
  };

  const addCourse = () => {
    if (!semester.trim() || !course.courseCode.trim() || !course.courseName.trim() ||
        !Number.isFinite(Number(course.creditHours)) || Number(course.creditHours) <= 0) {
      setError("Enter a semester and valid course code, name, and credit hours.");
      return;
    }
    setError("");
    const semesterDraft = record.semesters.find((item) => item.semester === semester) || {
      semester,
      semesterGPA: numericValue(semesterGPA),
      cgpa: numericValue(cgpa),
      lcgpa: numericValue(lcgpa),
      courses: [],
    };
    const nextSemester = {
      ...semesterDraft,
      semesterGPA: numericValue(semesterGPA),
      cgpa: numericValue(cgpa),
      lcgpa: numericValue(lcgpa),
      courses: [
        ...semesterDraft.courses.filter(
          (item) => item.courseCode.toUpperCase() !== course.courseCode.trim().toUpperCase()
        ),
        {
          ...course,
          courseCode: course.courseCode.trim(),
          courseName: course.courseName.trim(),
          creditHours: Number(course.creditHours),
          attendancePercentage: numericValue(course.attendancePercentage),
        },
      ],
    };
    setRecord((current) => ({
      ...current,
      semesters: [
        ...current.semesters.filter((item) => item.semester !== semester),
        nextSemester,
      ],
    }));
    setCourse(emptyCourse());
    setMessage("Course added to the semester draft. Save the academic record to persist it.");
  };

  const addStudyPlanCourse = () => {
    if (!planCourse.courseCode.trim() || !planCourse.courseName.trim() ||
        !Number.isFinite(Number(planCourse.creditHours)) || Number(planCourse.creditHours) <= 0) {
      setError("Enter valid study-plan course details.");
      return;
    }
    setError("");
    setRecord((current) => ({
      ...current,
      studyPlan: [
        ...current.studyPlan.filter(
          (item) => item.courseCode.toUpperCase() !== planCourse.courseCode.trim().toUpperCase()
        ),
        { ...planCourse, courseCode: planCourse.courseCode.trim(), courseName: planCourse.courseName.trim(), creditHours: Number(planCourse.creditHours) },
      ],
    }));
    setPlanCourse({ courseCode: "", courseName: "", creditHours: "" });
  };

  const addWarning = () => {
    if (!warning.code.trim() || !warning.description.trim()) {
      setError("Enter a warning code and description.");
      return;
    }
    setError("");
    setRecord((current) => ({
      ...current,
      academicWarnings: [
        ...current.academicWarnings,
        { ...warning, code: warning.code.trim(), description: warning.description.trim(), issuedAt: new Date().toISOString(), status: "active" },
      ],
    }));
    setWarning({ code: "", description: "" });
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await put(`/students/${studentId}/academics`, {
        academicLevel: record.academicLevel || "",
        verified: Boolean(record.verified),
        semesters: record.semesters || [],
        studyPlan: record.studyPlan || [],
        studyPlanVerified: Boolean(record.studyPlanVerified),
        academicWarnings: record.academicWarnings || [],
      });
      setRecord(response.data.academicRecord);
      setCalculations(response.data.calculations);
      setMessage("Academic record saved and audited.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save academic record.");
    }
  };

  const tabs = [
    { id: "standing", label: "Academic Standing" },
    { id: "courses", label: "Courses & Grades" },
    { id: "plan", label: "Study Plan" },
    { id: "warnings", label: "Academic Warnings" },
  ];

  const renderStandingTab = () => (
    <>
      <label>Academic level<input maxLength={80} value={record.academicLevel || ""} onChange={(event) => setRecord({ ...record, academicLevel: event.target.value })} /></label>
      <label className="admin-record-check"><input type="checkbox" checked={Boolean(record.verified)} onChange={(event) => setRecord({ ...record, verified: event.target.checked, studyPlanVerified: event.target.checked && Boolean(record.studyPlanVerified) })} />Academic record verified against approved source</label>
    </>
  );

  const renderCoursesTab = () => (
    <>
      <label>Semester<input maxLength={80} value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="Enter semester label from source records" /></label>
      <div className="admin-record-grid">
        <label>Semester GPA<input type="number" min="0" step="any" value={semesterGPA} onChange={(event) => setSemesterGPA(event.target.value)} /></label>
        <label>CGPA<input type="number" min="0" step="any" value={cgpa} onChange={(event) => setCgpa(event.target.value)} /></label>
        <label>LCGPA<input type="number" min="0" step="any" value={lcgpa} onChange={(event) => setLcgpa(event.target.value)} /></label>
      </div>
      <div className="admin-record-grid">
        <label>Course code<input maxLength={30} value={course.courseCode} onChange={(event) => setCourse({ ...course, courseCode: event.target.value })} /></label>
        <label>Course name<input maxLength={160} value={course.courseName} onChange={(event) => setCourse({ ...course, courseName: event.target.value })} /></label>
        <label>Credit hours<input type="number" min="0.1" step="any" value={course.creditHours} onChange={(event) => setCourse({ ...course, creditHours: event.target.value })} /></label>
        <label>Grade<input maxLength={20} value={course.grade} onChange={(event) => setCourse({ ...course, grade: event.target.value })} /></label>
        <label>Attendance %<input type="number" min="0" max="100" step="any" value={course.attendancePercentage} onChange={(event) => setCourse({ ...course, attendancePercentage: event.target.value })} /></label>
        <label>Course status<select value={course.status} onChange={(event) => setCourse({ ...course, status: event.target.value })}><option value="registered">Registered</option><option value="completed">Completed</option><option value="failed">Failed</option></select></label>
      </div>
      <div className="admin-record-actions">
        <button type="button" className="admin-secondary-button" onClick={addCourse}>Add course to semester</button>
      </div>
      {record.semesters.map((item) => (
        <article className="admin-record-list" key={item.semester}>
          <h4>{item.semester} · GPA {item.semesterGPA ?? "Unavailable"} · CGPA {item.cgpa ?? "Unavailable"} · LCGPA {item.lcgpa ?? "Unavailable"}</h4>
          {item.courses.map((entry) => (
            <p key={entry.courseCode}>
              {entry.courseCode} · {entry.courseName} · {entry.creditHours} credits · {entry.grade || "No grade"} · {entry.status}
              <button type="button" onClick={() => setRecord({ ...record, semesters: record.semesters.map((term) => term.semester === item.semester ? { ...term, courses: term.courses.filter((saved) => saved.courseCode !== entry.courseCode) } : term) })}>Remove</button>
            </p>
          ))}
        </article>
      ))}
    </>
  );

  const renderPlanTab = () => (
    <>
      <div className="admin-record-grid">
        <label>Course code<input maxLength={30} value={planCourse.courseCode} onChange={(event) => setPlanCourse({ ...planCourse, courseCode: event.target.value })} /></label>
        <label>Course name<input maxLength={160} value={planCourse.courseName} onChange={(event) => setPlanCourse({ ...planCourse, courseName: event.target.value })} /></label>
        <label>Credit hours<input type="number" min="0.1" step="any" value={planCourse.creditHours} onChange={(event) => setPlanCourse({ ...planCourse, creditHours: event.target.value })} /></label>
      </div>
      <div className="admin-record-actions">
        <button type="button" className="admin-secondary-button" onClick={addStudyPlanCourse}>Add study-plan course</button>
      </div>
      <label className="admin-record-check"><input type="checkbox" checked={Boolean(record.studyPlanVerified)} disabled={!record.verified || !record.studyPlan.length} onChange={(event) => setRecord({ ...record, studyPlanVerified: event.target.checked })} />Study plan verified</label>
      {record.studyPlan.map((item) => (
        <p className="admin-record-list" key={item.courseCode}>
          {item.courseCode} · {item.courseName} · {item.creditHours} credits
          <button type="button" onClick={() => setRecord({ ...record, studyPlan: record.studyPlan.filter((entry) => entry.courseCode !== item.courseCode), studyPlanVerified: false })}>Remove</button>
        </p>
      ))}
    </>
  );

  const renderWarningsTab = () => (
    <>
      <div className="admin-record-grid">
        <label>Warning code<input maxLength={40} value={warning.code} onChange={(event) => setWarning({ ...warning, code: event.target.value })} /></label>
        <label>Description<input maxLength={500} value={warning.description} onChange={(event) => setWarning({ ...warning, description: event.target.value })} /></label>
      </div>
      <div className="admin-record-actions">
        <button type="button" className="admin-secondary-button" onClick={addWarning}>Add warning</button>
      </div>
      {record.academicWarnings.map((item, index) => (
        <p className="admin-record-list" key={`${item.code}-${index}`}>
          {item.code} · {item.description} · {item.status}
          <button type="button" onClick={() => setRecord({ ...record, academicWarnings: record.academicWarnings.filter((_, warningIndex) => warningIndex !== index) })}>Remove</button>
        </p>
      ))}
    </>
  );

  return (
    <section className="admin-academic-records-page admin-student-management admin-section-card">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">ACADEMIC MANAGEMENT</p>
          <h2>Academic Records</h2>
          <p>Manage verified grades, attendance, study plans, and academic warnings.</p>
        </div>
      </div>
      {error && <p className="admin-auth-error" role="alert">{error}</p>}
      {message && <p className="message-box">{message}</p>}
      <label className="admin-record-student">
        Select student
        <select value={studentId} onChange={(event) => selectStudent(event.target.value)}>
          <option value="">Select a student</option>
          {students.map((entry) => (
            <option key={entry._id} value={entry._id}>
              {entry.name} · {entry.studentId || entry.email}
            </option>
          ))}
        </select>
      </label>

      {student && (
        <>
          <div className="admin-record-summary">
            <p><strong>{student.name}</strong></p>
            <p><span className="admin-record-meta-label">University ID</span> {student.studentId || "Unavailable"}</p>
            <p><span className="admin-record-meta-label">Department</span> {student.department || "Unavailable"}</p>
            <p><span className="admin-record-meta-label">Major</span> {student.program || "Unavailable"}</p>
            {calculations.available ? (
              <>
                <p><span className="admin-record-meta-label">Completed courses</span> {calculations.completedCourses}</p>
                <p><span className="admin-record-meta-label">Failed courses</span> {calculations.failedCourses}</p>
                <p><span className="admin-record-meta-label">Registered courses</span> {calculations.registeredCourses}</p>
                <p><span className="admin-record-meta-label">Completed credit hours</span> {calculations.completedCreditHours}</p>
                <p><span className="admin-record-meta-label">Academic progress</span> {calculations.academicProgressPercentage == null ? "Unavailable until a study plan is verified" : `${calculations.academicProgressPercentage}%`}</p>
                <p><span className="admin-record-meta-label">Average attendance</span> {calculations.averageAttendancePercentage == null ? "Unavailable" : `${calculations.averageAttendancePercentage}%`}</p>
                {calculations.remainingCourses && <p><span className="admin-record-meta-label">Remaining courses</span> {calculations.remainingCourses.map((item) => item.courseCode).join(", ") || "None"}</p>}
              </>
            ) : <p><span className="admin-record-meta-label">Progress</span> Calculated progress is unavailable until the academic record is verified.</p>}
          </div>

          <form className="admin-academic-records-form admin-academic-form" onSubmit={saveRecord}>
            <div className="admin-record-tabs" role="tablist" aria-label="Academic record sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`admin-record-tab-button${activeTab === tab.id ? " is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "standing" && renderStandingTab()}
            {activeTab === "courses" && renderCoursesTab()}
            {activeTab === "plan" && renderPlanTab()}
            {activeTab === "warnings" && renderWarningsTab()}

            <div className="admin-record-actions">
              <button type="submit" className="admin-primary-button">Save academic record</button>
              <button type="button" className="admin-secondary-button" onClick={() => downloadReport(`/reports/students/${studentId}/academic.pdf`, `academic-report-${student.studentId || studentId}.pdf`).catch((downloadError) => setError(downloadError.response?.data?.message || "Unable to download student report."))}>Download Academic PDF</button>
            </div>
          </form>
        </>
      )}
    </section>
  );
};

export default AdminAcademicRecords;
