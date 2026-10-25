const request = require("supertest");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const {
  app,
  loadServerEnv,
  UserModel,
  OtpModel,
  PasswordResetModel,
  AdminAccountModel,
  AdminSessionModel,
  AdminOtpModel,
  AdminPasswordResetModel,
  AcademicRecordModel,
  AcademicAuditModel,
} = require("./index");

const originalEnv = { ...process.env };
const adminSessionToken = "test-admin-session-token";
const adminCsrfToken = "test-admin-csrf-token";
const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

const authenticateAdminRequest = (testRequest, csrf = false) => {
  testRequest.set("Cookie", `student_support_admin_session=${adminSessionToken}`);
  if (csrf) testRequest.set("X-CSRF-Token", adminCsrfToken);
  return testRequest;
};

const mockAuthenticatedAdmin = () => {
  jest.spyOn(AdminSessionModel, "findOne").mockResolvedValue({
    tokenHash: tokenHash(adminSessionToken),
    csrfHash: tokenHash(adminCsrfToken),
    adminEmail: "admin@studentsupport.ai",
    expiresAt: new Date(Date.now() + 60_000),
  });
};

const mockEmailDelivery = () => {
  process.env.EMAIL_USER = "sender@example.com";
  process.env.EMAIL_PASS = "app-password";
  const sendMail = jest.fn().mockResolvedValue({ messageId: "test-message-id" });
  jest.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail });
  return sendMail;
};

describe("server API", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  test("register API responds correctly", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue(null);
    const saveSpy = jest.spyOn(UserModel.prototype, "save").mockResolvedValue({});
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate");

    const response = await request(app).post("/register").send({
      name: "Test Student",
      email: "TEST@example.com",
      password: "password123",
      department: "Engineering",
      role: "admin",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      email: "test@example.com",
      user: { department: "Engineering" },
    });
    expect(saveSpy.mock.instances[0].password).not.toBe("password123");
    expect(await bcrypt.compare("password123", saveSpy.mock.instances[0].password)).toBe(true);
    expect(saveSpy.mock.instances[0].isVerified).toBe(true);
    expect(saveSpy.mock.instances[0].role).toBe("student");
    expect(saveSpy.mock.instances[0].department).toBe("Engineering");
    expect(otpSpy).not.toHaveBeenCalled();
  });

  test("register API requires a supported student department", async () => {
    const missingDepartmentResponse = await request(app).post("/register").send({
      name: "Test Student",
      email: "missing-department@example.com",
      password: "password123",
    });
    const invalidDepartmentResponse = await request(app).post("/register").send({
      name: "Test Student",
      email: "invalid-department@example.com",
      password: "password123",
      department: "Other",
    });

    expect(missingDepartmentResponse.status).toBe(400);
    expect(missingDepartmentResponse.body.message).toBe("Department is required");
    expect(invalidDepartmentResponse.status).toBe(400);
    expect(invalidDepartmentResponse.body.message).toBe("Invalid department selected");
  });

  test("loads email variables from server .env by explicit path", () => {
    const savedEnv = { ...process.env };
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    loadServerEnv();

    expect(process.env.EMAIL_USER).toBeTruthy();
    expect(process.env.EMAIL_PASS).toBeTruthy();

    process.env = savedEnv;
  });

  test("admin login seeds a configured bcrypt hash and issues an HttpOnly session", async () => {
    const passwordHash = await bcrypt.hash("TestAdmin@123", 10);
    process.env.ADMIN_1_PASSWORD_HASH = passwordHash;
    jest.spyOn(AdminAccountModel, "findOne").mockResolvedValue(null);
    jest.spyOn(AdminAccountModel, "findOneAndUpdate").mockResolvedValue({
      email: "admin@studentsupport.ai",
      passwordHash,
      displayName: "",
      title: "",
    });
    jest.spyOn(AdminSessionModel, "create").mockResolvedValue({});

    const response = await request(app).post("/admin/auth/login").send({
      email: "ADMIN@STUDENTSUPPORT.AI",
      password: "TestAdmin@123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      admin: { email: "admin@studentsupport.ai" },
      csrfToken: expect.any(String),
    });
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"][0]).toContain("SameSite=Lax");
    expect(AdminAccountModel.findOneAndUpdate.mock.calls[0][1].$setOnInsert.passwordHash).toBe(passwordHash);
    expect(response.body).not.toHaveProperty("admin.passwordHash");
  });

  test("admin login refuses unconfigured credential hashes without resetting credentials", async () => {
    delete process.env.ADMIN_1_PASSWORD_HASH;
    jest.spyOn(AdminAccountModel, "findOne").mockResolvedValue(null);
    const upsertSpy = jest.spyOn(AdminAccountModel, "findOneAndUpdate");

    const response = await request(app).post("/admin/auth/login").send({
      email: "admin@studentsupport.ai",
      password: "existing-admin-password",
    });

    expect(response.status).toBe(503);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  test("admin login is rate limited after repeated attempts", async () => {
    process.env.ADMIN_1_PASSWORD_HASH = await bcrypt.hash("TestAdmin@123", 10);
    jest.spyOn(AdminAccountModel, "findOne").mockResolvedValue({
      email: "admin@studentsupport.ai",
      passwordHash: process.env.ADMIN_1_PASSWORD_HASH,
    });
    const attempts = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(app).post("/admin/auth/login").send({
          email: "admin@studentsupport.ai",
          password: "incorrect",
        })
      )
    );
    const blocked = await request(app).post("/admin/auth/login").send({
      email: "admin@studentsupport.ai",
      password: "incorrect",
    });
    expect(attempts.every((response) => response.status === 401)).toBe(true);
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeTruthy();
  });

  test("admin password recovery sends a code without returning or logging it", async () => {
    process.env.ADMIN_1_PASSWORD_HASH = await bcrypt.hash("TestAdmin@123", 10);
    jest.spyOn(AdminAccountModel, "findOne").mockResolvedValue({
      email: "admin@studentsupport.ai",
      passwordHash: process.env.ADMIN_1_PASSWORD_HASH,
    });
    const otpSpy = jest.spyOn(AdminOtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = mockEmailDelivery();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const response = await request(app).post("/admin/auth/forgot-password").send({
      email: "admin@studentsupport.ai",
    });

    expect(response.status).toBe(200);
    expect(response.body.otp).toBeUndefined();
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(otpSpy).toHaveBeenCalledWith(
      { email: "admin@studentsupport.ai" },
      expect.objectContaining({
        codeHash: expect.stringMatching(/^\$2[aby]\$/),
        expiresAt: expect.any(Date),
      }),
      { upsert: true, new: true }
    );
    expect(logSpy.mock.calls.flat().join(" ")).not.toMatch(/\b\d{6}\b/);
  });

  test("admin APIs reject unauthenticated requests", async () => {
    const [students, summary, pdf] = await Promise.all([
      request(app).get("/admin/students"),
      request(app).get("/admin/reports/summary"),
      request(app).get("/admin/reports/summary.pdf"),
    ]);
    expect(students.status).toBe(401);
    expect(summary.status).toBe(401);
    expect(pdf.status).toBe(401);
  });

  test("admin mutations require a valid CSRF token", async () => {
    mockAuthenticatedAdmin();
    const updateSpy = jest.spyOn(AdminAccountModel, "findOneAndUpdate");
    const response = await request(app)
      .put("/admin/profile")
      .set("Cookie", `student_support_admin_session=${adminSessionToken}`)
      .send({ displayName: "Admin" });

    expect(response.status).toBe(403);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("admin academic records are validated, saved, and audited", async () => {
    const studentId = "507f1f77bcf86cd799439011";
    mockAuthenticatedAdmin();
    jest.spyOn(UserModel, "findOne").mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: studentId }),
    });
    const savedRecord = {
      studentId,
      verified: true,
      studyPlanVerified: true,
      studyPlan: [{ courseCode: "IT101", courseName: "Introduction", creditHours: 3 }],
      semesters: [{
        semester: "Term 1",
        cgpa: 3,
        courses: [{
          courseCode: "IT101",
          courseName: "Introduction",
          creditHours: 3,
          grade: "A",
          attendancePercentage: 92,
          status: "completed",
        }],
      }],
      academicWarnings: [],
    };
    jest.spyOn(AcademicRecordModel, "findOneAndUpdate").mockReturnValue({
      lean: jest.fn().mockResolvedValue(savedRecord),
    });
    const auditSpy = jest.spyOn(AcademicAuditModel, "create").mockResolvedValue({});

    const academicPayload = {
      verified: savedRecord.verified,
      studyPlanVerified: savedRecord.studyPlanVerified,
      studyPlan: savedRecord.studyPlan,
      semesters: savedRecord.semesters,
      academicWarnings: savedRecord.academicWarnings,
    };
    const response = await authenticateAdminRequest(
      request(app).put(`/admin/students/${studentId}/academics`).send(academicPayload),
      true
    );

    expect(response.status).toBe(200);
    expect(response.body.calculations).toMatchObject({
      completedCreditHours: 3,
      completedCourses: 1,
      academicProgressPercentage: 100,
      averageAttendancePercentage: 92,
    });
    expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
      adminEmail: "admin@studentsupport.ai",
      changedFields: expect.arrayContaining(["semesters", "studyPlan"]),
    }));
  });

  test("admin academic records reject invalid values before writing", async () => {
    mockAuthenticatedAdmin();
    const updateSpy = jest.spyOn(AcademicRecordModel, "findOneAndUpdate");
    const response = await authenticateAdminRequest(
      request(app)
        .put("/admin/students/507f1f77bcf86cd799439011/academics")
        .send({ verified: true, semesters: [{ semester: "Term 1", semesterGPA: -1, courses: [] }] }),
      true
    );
    expect(response.status).toBe(400);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("login API responds correctly", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const findSpy = jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      password: hashedPassword,
      isVerified: false,
    });

    const response = await request(app).post("/login").send({
      email: "TEST@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Login Successful",
    });
    const lookup = findSpy.mock.calls[0][0];
    expect(lookup.$and[0]).toEqual({ role: { $ne: "admin" } });
    const emailCondition = lookup.$and[1].$or.find((condition) => condition.email);
    expect(emailCondition.email).toEqual({
      $regex: "^test@example\\.com$",
      $options: "i",
    });
  });

  test("login accepts and upgrades legacy plain-text password", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      _id: "student-1",
      email: "test@example.com",
      password: "password123",
      isVerified: false,
    });
    const updateSpy = jest.spyOn(UserModel, "updateOne").mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });

    const response = await request(app).post("/login").send({
      email: "TEST@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalled();
    const update = updateSpy.mock.calls[0][1].$set;
    expect(updateSpy.mock.calls[0][0]).toEqual({ _id: "student-1" });
    expect(update.password).not.toBe("password123");
    expect(await bcrypt.compare("password123", update.password)).toBe(true);
    expect(update.isVerified).toBe(true);
    expect(response.body).toMatchObject({
      success: true,
      message: "Login Successful",
    });
  });

  test("verify OTP updates isVerified and removes OTP", async () => {
    const hashedOtp = await bcrypt.hash("123456", 10);
    jest.spyOn(OtpModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      code: hashedOtp,
      expiresAt: new Date(Date.now() + 60000),
    });
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      _id: "student-1",
      email: "test@example.com",
      isVerified: false,
    });
    const updateSpy = jest.spyOn(UserModel, "updateOne").mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    const deleteSpy = jest.spyOn(OtpModel, "deleteMany").mockResolvedValue({
      deletedCount: 1,
    });
    const resetTokenSpy = jest
      .spyOn(PasswordResetModel, "findOneAndUpdate")
      .mockResolvedValue({});

    const response = await request(app).post("/verify-otp").send({
      email: "TEST@example.com",
      otp: "123456",
    });

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "student-1" },
      {
        $set: {
          isVerified: true,
          verified: true,
        },
      }
    );
    expect(deleteSpy).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(response.body).toMatchObject({
      success: true,
      message: "Email verified successfully",
      resetToken: expect.any(String),
    });
    expect(resetTokenSpy).toHaveBeenCalledWith(
      { email: "test@example.com" },
      expect.objectContaining({
        token: expect.not.stringMatching(response.body.resetToken),
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
      }),
      { upsert: true, new: true }
    );
  });

  test("reset password updates user password with bcrypt hash", async () => {
    const hashedToken = await bcrypt.hash("reset-token", 10);
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      _id: "student-1",
      email: "test@example.com",
      isVerified: true,
    });
    jest.spyOn(PasswordResetModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60000),
    });
    const updateSpy = jest.spyOn(UserModel, "updateOne").mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    const resetDeleteSpy = jest.spyOn(PasswordResetModel, "deleteMany").mockResolvedValue({
      deletedCount: 1,
    });
    const otpDeleteSpy = jest.spyOn(OtpModel, "deleteMany").mockResolvedValue({
      deletedCount: 1,
    });

    const response = await request(app).post("/reset-password").send({
      email: "TEST@example.com",
      resetToken: "reset-token",
      password: "NewPass1234!",
    });

    expect(response.status).toBe(200);
    expect(updateSpy.mock.calls[0][0]).toEqual({ _id: "student-1" });
    const update = updateSpy.mock.calls[0][1].$set;
    expect(update.password).not.toBe("NewPass1234!");
    expect(await bcrypt.compare("NewPass1234!", update.password)).toBe(true);
    expect(update.isVerified).toBe(true);
    expect(update.verified).toBe(true);
    expect(resetDeleteSpy).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(otpDeleteSpy).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(response.body).toMatchObject({
      success: true,
      message: "Password reset successfully",
    });
  });

  test("send reset OTP allows already verified users", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = mockEmailDelivery();

    const response = await request(app).post("/send-reset-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(200);
    expect(otpSpy).toHaveBeenCalledWith(
      { email: "test@example.com" },
      expect.objectContaining({
        code: expect.not.stringMatching(/^\d{6}$/),
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
      }),
      { upsert: true, new: true }
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: "Your password reset verification code",
      })
    );
    expect(response.body).toMatchObject({
      success: true,
      message: "OTP has been sent.",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("send reset OTP rejects missing users", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue(null);
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate");

    const response = await request(app).post("/send-reset-otp").send({
      email: "missing@example.com",
    });

    expect(response.status).toBe(404);
    expect(otpSpy).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({
      success: false,
      message: "User not found",
    });
  });

  test("forgot password alias sends reset OTP", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = mockEmailDelivery();

    const response = await request(app).post("/forgot-password").send({
      identifier: "TEST@example.com",
    });

    expect(response.status).toBe(200);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
      })
    );
    expect(response.body).toMatchObject({
      success: true,
      message: "OTP has been sent.",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("reset OTP ignores placeholder EMAIL values and uses SMTP fallback", async () => {
    process.env.EMAIL_USER = "your_email@gmail.com";
    process.env.EMAIL_PASS = "your_app_password";
    process.env.SMTP_USER = "sender@example.com";
    process.env.SMTP_PASS = "app-password";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "student@example.com",
      isVerified: true,
      verified: true,
    });
    jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = jest.fn().mockResolvedValue({ messageId: "test-message-id" });
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail });

    const response = await request(app).post("/send-reset-otp").send({
      identifier: "student@example.com",
    });

    expect(response.status).toBe(200);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          user: "sender@example.com",
          pass: "app-password",
        },
      })
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
      })
    );
  });

  test("send reset OTP returns clear email config error", async () => {
    process.env.EMAIL_USER = "your_email@gmail.com";
    process.env.EMAIL_PASS = "your_app_password";
    process.env.SMTP_USER = "";
    process.env.SMTP_PASS = "";
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).post("/send-reset-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[send-reset-otp] Failed to send reset code")
    );
    expect(response.body).toMatchObject({
      success: false,
      message: "Email service is not configured. Set EMAIL_USER and EMAIL_PASS in server/.env.",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("send reset OTP fails without storing OTP when sendMail fails", async () => {
    process.env.EMAIL_USER = "sender@example.com";
    process.env.EMAIL_PASS = "app-password";
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: true,
      verified: true,
    });
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate");
    const sendMail = jest.fn().mockRejectedValue(new Error("SMTP rejected message"));
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({ sendMail });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).post("/send-reset-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(500);
    expect(sendMail).toHaveBeenCalled();
    expect(otpSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[email] OTP delivery failed (Error)."
    );
    expect(response.body).toMatchObject({
      success: false,
      message: "Unable to send OTP email: SMTP rejected message",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("send OTP returns generated code for unverified users", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({
      email: "test@example.com",
      isVerified: false,
      verified: false,
    });
    const otpSpy = jest.spyOn(OtpModel, "findOneAndUpdate").mockResolvedValue({});
    const sendMail = mockEmailDelivery();

    const response = await request(app).post("/send-otp").send({
      email: "TEST@example.com",
    });

    expect(response.status).toBe(200);
    expect(otpSpy).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(response.body).toMatchObject({
      success: true,
      message: "OTP has been sent.",
    });
    expect(response.body.otp).toBeUndefined();
  });

  test("admin student detail API returns a single student record", async () => {
    mockAuthenticatedAdmin();
    const studentDoc = {
      _id: "student-1",
      name: "Test Student",
      email: "student@example.com",
      studentId: "STU-1001",
      role: "student",
      phoneNumber: "123456789",
      program: "Computer Science",
      academicYear: "2025",
      department: "Engineering",
      gpa: 3.75,
      riskStatus: "Low risk",
      alerts: ["Met with advisor"],
      recommendations: ["Continue current study plan"],
    };

    jest.spyOn(UserModel, "findOne").mockReturnValue({
      select: jest.fn().mockResolvedValue(studentDoc),
    });

    const response = await authenticateAdminRequest(request(app).get("/admin/students/student-1"));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.student.name).toBe("Test Student");
    expect(response.body.student.gpa).toBe(3.75);
    expect(response.body.student.riskStatus).toBe("Low risk");
  });

  test("Admin summary report endpoint generates a PDF from records", async () => {
    mockAuthenticatedAdmin();
    jest.spyOn(UserModel, "find").mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([{
          _id: "507f1f77bcf86cd799439011",
          name: "Test Student",
          studentId: "UTAS-1",
          department: "Engineering",
          program: "Major",
        }]),
      }),
    });
    jest.spyOn(AcademicRecordModel, "find").mockReturnValue({
      lean: jest.fn().mockResolvedValue([{
        studentId: "507f1f77bcf86cd799439011",
        verified: true,
        studyPlanVerified: true,
        studyPlan: [{ courseCode: "C1", courseName: "Course 1", creditHours: 3 }],
        semesters: [{
          semester: "Term 1",
          cgpa: 3.2,
          courses: [{
            courseCode: "C1",
            courseName: "Course 1",
            creditHours: 3,
            attendancePercentage: 90,
            status: "completed",
          }],
        }],
        academicWarnings: [],
      }]),
    });

    const response = await authenticateAdminRequest(
      request(app).get("/admin/reports/summary.pdf")
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.text || response.body.toString()).toContain("%PDF-1.4");
  });
});
